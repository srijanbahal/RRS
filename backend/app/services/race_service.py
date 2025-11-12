"""
RaceService — Core race management logic.

This service handles:
  • Creating races
  • Registering agents (and their cars)
  • Running race loop (simulation)
  • Calling LLMDecisionEngine for control decisions
  • Broadcasting telemetry updates to all spectators

Author: Srijan
"""

import asyncio
import time
import uuid
import math
from typing import Dict, List, Any

# === Import models ===
from app.models.race_model import Race, RaceStatus
from app.models.agent_model import Agent
from app.models.cars_model import Car
from app.models.circuit_model import Circuit
from app.models.telemetry_model import Telemetry

# === Import services ===
from app.services.llm_engine import LLMDecisionEngine
from app.services.websocket_manager import ws_manager

# Optional: for logs
import logging

logger = logging.getLogger("RaceService")


class RaceService:
    """
    RaceService is the central orchestrator for running AI Grand Prix races.
    It stores all active races, creates new ones, and runs simulation loops.
    """

    def __init__(self):
        # In-memory store for all races
        # Structure: { race_id: Race() }
        self.races: Dict[str, Race] = {}

        # Tick rate (seconds between updates)
        self.tick_interval: float = 1.0

        # Optional: background tasks to allow cancellation
        self.active_tasks: Dict[str, asyncio.Task] = {}

    # -----------------------------------------------------------------------
    # 1️. Create Race
    # -----------------------------------------------------------------------
    async def create_race(self, data: dict) -> dict:
        """
        Create a new Race object and store it.

        Expected input (data):
        {
            "name": "Monaco GP",
            "laps": 5,
            "circuit": { "name": "Monaco", "track_length": 5000.0 }
        }

        Returns:
        {
            "race_id": "<uuid>",
            "name": "Monaco GP",
            "laps": 5,
            "status": "PENDING"
        }
        """

        # Extract fields with fallbacks
        race_name = data.get("name", "Unnamed Race")
        laps = data.get("laps") or data.get("Laps") or 5
        circuit_data = data.get("circuit")

        # 2. Instantiate a Circuit (default or custom)
        if circuit_data:
            circuit = Circuit(
                name=circuit_data.get("name", "Default Circuit"),
                track_length=circuit_data.get("track_length", 5000.0),
            )
        else:
            circuit = Circuit(name="Default Circuit")

        # 3️. Create Race object
        race = Race(
            name=race_name,
            circuit=circuit,
            max_laps=laps,
        )

        # 4️. Store race in memory for now
        self.races[race.id] = race

        # 5️. Log creation
        logger.info(
            f"Race created: {race_name} ({race.id}) with {laps} laps on {circuit.name}"
        )

        # 6️. Return minimal race info
        return {
            "success": True,
            "race_id": race.id,
            "name": race.name,
            "laps": race.max_laps,
            "status": race.status,
            "circuit": circuit.name,
        }

    # -----------------------------------------------------------------------
    # 2️. Register Agent (Driver)
    # -----------------------------------------------------------------------
    async def register_agent(self, data: dict) -> dict:
        """
        Registers a new agent (driver) for a given race and creates its Car.

        Expected input:
        {
            "race_id": "<uuid>",
            "name": "RedBullAI",
            "personality": "aggressive",
            "team": "RedBull"
        }

        Steps:
          • Create Agent()
          • Create Car() linked to this agent
          • Add car to race.cars dict
        """
        
        race_id = data.get("race_id", 00)
        agent = data.get("agent")

        
        if not race_id or self.races[race_id] == None:
            return {"success": False, "error": "Invalid race_id"}

        race = self.races[race_id]

        
        agent = Agent(
            name=data.get("name"),
            personality=data.get("personality", "balanced"),
            team=data.get("team"),
        )

        
        car = Car(
            agent_id=agent.id,
            team=agent.team,
        )
        
        
        race.add_car(car)
        
        
        logger.info(f"Agent '{agent.name}' registered in race {race.name} with car {car.id}")

        # Return minimal info
        return {
            "success": True,
            "race_id": race.id,
            "agent_id": agent.id,
            "car_id": car.id,
            "agent_name": agent.name,
            "team": agent.team,
            "status": race.status,
        }
        pass

    # -----------------------------------------------------------------------
    # 3️. Start Race (public entry)
    # -----------------------------------------------------------------------
    async def start_race(self, race_id: str) -> dict:
        """
        Starts the race loop asynchronously.

        Behavior:
        • Validate race exists
        • Change race status → ACTIVE
        • Create asyncio background task for race loop
        • Store the task reference (for cancellation later)
        """

        # Check if race exists
        if race_id not in self.races:
            return {"success": False, "error": f"Race {race_id} not found"}

        race = self.races[race_id]

        # Check if race is already running or finished
        if race.status in ["ACTIVE", "FINISHED", "CANCELLED"]:
            return {
                "success": False,
                "message": f"Cannot start race in '{race.status}' state."
            }

        # Update race status to ACTIVE
        race.status = "ACTIVE"

        # Start the race loop as a background asyncio task
        # This prevents blocking the FastAPI request cycle
        loop = asyncio.get_event_loop()
        race_task = loop.create_task(self._race_loop(race_id))

        # Store task reference (useful for cancellation later)
        self.active_tasks[race_id] = race_task

        # Log and return response
        logger.info(f"Race {race.name} ({race_id}) started with {len(race.cars)} cars.")
        return {
            "success": True,
            "race_id": race_id,
            "message": f"Race '{race.name}' started successfully.",
            "status": race.status,
            "cars": list(race.cars.keys())
        }


    async def _race_loop(self, race_id: str):
        """
        Main async race simulation loop.
        Runs every tick until all cars finish or race cancelled.
        """
        # Validate race
        if race_id not in self.races:
            logger.error(f"_race_loop: race {race_id} not found")
            return

        race: Race = self.races[race_id]

        # instantiate LLM engine once for the race (teammate's implementation)
        llm = LLMDecisionEngine()

        # mark start time metadata
        race.metadata.setdefault("start_time", time.time())
        logger.info(f"Race loop starting for {race.name} ({race_id}) with {len(race.cars)} cars")

        try:
            # Continue while race is ACTIVE
            while race.status == RaceStatus.ACTIVE:
                # iterate over cars (make a list to avoid runtime-dict-change issues)
                car_items = list(race.cars.items())
                # track if any car still running
                any_running = False

                for car_id, car in car_items:
                    # skip cars that are already finished or not running
                    if car.status != "RUNNING":
                        continue

                    any_running = True

                    # Build state for LLM (use helper if implemented, else minimal state)
                    try:
                        state = await self._build_state(race, car)
                    except Exception:
                        # fallback minimal state if _build_state is not implemented or errors
                        state = {
                            "race": {"id": race.id, "lap": car.lap, "max_laps": race.max_laps},
                            "car": {
                                "id": car.id,
                                "speed": car.speed,
                                "fuel": car.fuel,
                                "tire_wear": car.tire_wear,
                                "position": car.position,
                                "orientation": car.orientation,
                            },
                            "track": {
                                "length": race.circuit.track_length if race.circuit else None
                            }
                        }

                    # Query LLMDecisionEngine with timeout protection
                    decision = {"throttle": 0.5, "steer": 0.0, "brake": 0.0}  # default fallback
                    try:
                        # keep LLM calls bounded to avoid hanging the loop
                        decision = await asyncio.wait_for(llm.decide(state), timeout=3.0)
                        # Ensure returned structure contains numeric values
                        # Defensive transforms
                        decision = {
                            "throttle": float(decision.get("throttle", 0.0)),
                            "steer": float(decision.get("steer", 0.0)),
                            "brake": float(decision.get("brake", 0.0))
                        }
                    except asyncio.TimeoutError:
                        logger.warning(f"LLM timeout for car {car_id} in race {race_id}; using fallback decision")
                    except asyncio.CancelledError:
                        # propagate cancellation
                        raise
                    except Exception as e:
                        logger.warning(f"LLM error for car {car_id} in race {race_id}: {e}; using fallback decision")

                    # Apply the decision to the car (updates position, speed, fuel, etc.)
                    try:
                        car_state_update = car.apply_decision(decision, dt=self.tick_interval)
                    except Exception as e:
                        logger.exception(f"Error applying decision to car {car_id}: {e}")
                        # mark car damaged if critical error (optional)
                        car.status = "CRASHED"

                    # Lap completion check (if circuit exists)
                    if race.circuit:
                        if car.lap_distance >= race.circuit.track_length:
                            car.lap += 1
                            car.lap_distance -= race.circuit.track_length
                            logger.info(f"Car {car_id} completed lap {car.lap - 1} -> now lap {car.lap}")
                            # emit lap-complete event optionally
                            lap_event = {
                                "event": "lap-complete",
                                "race_id": race.id,
                                "car_id": car.id,
                                "agent_id": car.agent_id,
                                "lap": car.lap,
                                "timestamp": time.time()
                            }
                            await ws_manager.broadcast(race_id, lap_event)

                            # If car finished all laps
                            if car.lap > race.max_laps:
                                car.status = "FINISHED"
                                logger.info(f"Car {car_id} finished race (laps > {race.max_laps})")

                    # Build telemetry object and broadcast
                    telemetry = Telemetry(
                        race_id=race.id,
                        car_id=car.id,
                        agent_id=car.agent_id or "",
                        lap=car.lap,
                        speed=car.speed,
                        position=car.position,
                        decision=decision,
                        fuel=car.fuel,
                        tire_wear=car.tire_wear
                    ).to_dict()

                    # Broadcast telemetry to connected clients
                    try:
                        await ws_manager.broadcast(race_id, telemetry)
                    except Exception as e:
                        logger.warning(f"WebSocket broadcast failed for race {race_id}: {e}")

                # After iterating cars, check for termination
                # If no cars are running: finish the race
                if not any_running or all(c.status in ("FINISHED", "CRASHED", "PIT") for c in race.cars.values()):
                    race.status = RaceStatus.FINISHED
                    race.metadata["end_time"] = time.time()
                    logger.info(f"Race {race_id} all cars done — marking FINISHED")
                    # optionally broadcast race-finished event
                    finish_event = {
                        "event": "race-finished",
                        "race_id": race.id,
                        "timestamp": time.time()
                    }
                    try:
                        await ws_manager.broadcast(race_id, finish_event)
                    except Exception:
                        pass
                    break

                # update global race.current_lap if you want (max of car laps)
                try:
                    race.current_lap = max((c.lap for c in race.cars.values()), default=race.current_lap)
                except Exception:
                    pass

                # Sleep until next tick (non-blocking)
                await asyncio.sleep(self.tick_interval)

        except asyncio.CancelledError:
            # Handle cancellation: mark race cancelled and re-raise to allow outer cancellation management
            race.status = RaceStatus.CANCELLED
            race.metadata["cancel_time"] = time.time()
            logger.info(f"Race loop for {race_id} cancelled.")
            raise
        except Exception as e:
            # Unexpected exception: mark race as cancelled/errored
            race.status = RaceStatus.CANCELLED
            race.metadata["error"] = str(e)
            race.metadata["error_time"] = time.time()
            logger.exception(f"Unhandled exception in race loop {race_id}: {e}")
        finally:
            # Cleanup: remove active task reference if present
            if race_id in self.active_tasks:
                task = self.active_tasks.pop(race_id, None)
                # do not cancel here; assume cancellation handled elsewhere
            # ensure final status recorded
            if race.status not in (RaceStatus.FINISHED, RaceStatus.CANCELLED):
                race.metadata.setdefault("end_time", time.time())
                race.status = RaceStatus.FINISHED
            logger.info(f"Race loop ended for {race_id} with status {race.status}")


    # -----------------------------------------------------------------------
    # 5️. Build Car State for LLM
    # -----------------------------------------------------------------------
    async def _build_state(self, race: Race, car: Car) -> dict:
        """
        Build the state dict to send to the LLMDecisionEngine.
        Includes:
         - race context (id, lap, max_laps, total cars)
         - car telemetry (full snapshot)
         - track info (length, next waypoint + distance)
         - nearby vehicles summary (id, distance, relative_speed, position)
        """
        # Basic race info
        race_info: Dict[str, Any] = {
            "id": race.id,
            "name": race.name,
            "lap": int(car.lap),
            "max_laps": int(race.max_laps),
            "current_lap": int(race.current_lap),
            "total_cars": len(race.cars)
        }

        # Car snapshot (use to_dict from Car model)
        car_info = car.to_dict()

        # Track info (safe access)
        track_info: Dict[str, Any] = {
            "track_length": None,
            "next_waypoint": None,
            "distance_to_next_waypoint": None,
            "pit_positions": race.circuit.pit_positions if race.circuit else []
        }

        if race.circuit:
            track_info["track_length"] = float(race.circuit.track_length)
            # compute nearest waypoint and distance to next waypoint if waypoints exist
            if getattr(race.circuit, "waypoints", None):
                # get nearest waypoint index (circuit helper)
                try:
                    nx = race.circuit.get_nearest_waypoint_idx(car.position[0], car.position[1])
                except Exception:
                    nx = 0
                # next waypoint index
                next_idx = (nx + 1) % max(1, len(race.circuit.waypoints))
                # waypoint objects
                try:
                    wp_next = race.circuit.waypoints[next_idx]
                    track_info["next_waypoint"] = {"index": next_idx, "x": wp_next.x, "y": wp_next.y, "speed_limit": wp_next.speed_limit}
                    dx = wp_next.x - car.position[0]
                    dy = wp_next.y - car.position[1]
                    track_info["distance_to_next_waypoint"] = math.sqrt(dx * dx + dy * dy)
                except Exception:
                    track_info["next_waypoint"] = None
                    track_info["distance_to_next_waypoint"] = None
            else:
                # no waypoints: we can approximate distance on lap remaining
                track_info["next_waypoint"] = None
                remaining = max(0.0, race.circuit.track_length - car.lap_distance)
                track_info["distance_to_next_waypoint"] = remaining

        # Nearby vehicles: compute distances to other cars and provide small summary
        nearby: list = []
        NEARBY_RADIUS = 300.0  # meters, tune as needed
        for other_id, other in race.cars.items():
            if other_id == car.id:
                continue
            dx = other.position[0] - car.position[0]
            dy = other.position[1] - car.position[1]
            dist = math.sqrt(dx*dx + dy*dy)
            if dist <= NEARBY_RADIUS:
                nearby.append({
                    "car_id": other.id,
                    "agent_id": other.agent_id,
                    "position": [float(other.position[0]), float(other.position[1])],
                    "distance": float(dist),
                    "relative_speed": float(other.speed - car.speed),
                    "status": other.status
                })

        # Sort nearby by distance (closest first) and limit to top N
        nearby_sorted = sorted(nearby, key=lambda x: x["distance"])[:10]

        # Compose final state
        state = {
            "timestamp": time.time(),
            "race": race_info,
            "car": car_info,
            "track": track_info,
            "nearby_vehicles": nearby_sorted
        }

        return state

    # -----------------------------------------------------------------------
    # 6️⃣ Optional: Stop / Cancel Race
    # -----------------------------------------------------------------------
    async def stop_race(self, race_id: str):
        """
        Cancel a running race task (if present) and update race status.

        Returns a dict with success status and message.
        """
        if race_id not in self.races:
            return {"success": False, "error": "race_not_found"}

        race = self.races[race_id]

        # If there's an active asyncio Task for this race, cancel it
        task = self.active_tasks.get(race_id)
        if task is None:
            # If no task, set status appropriately
            prev_status = race.status
            if prev_status in ("FINISHED", "CANCELLED"):
                return {"success": True, "message": f"Race already in state '{prev_status}'"}
            # If not running, mark CANCELLED
            race.status = "CANCELLED"
            race.metadata["cancel_time"] = time.time()
            return {"success": True, "message": "Race cancelled (no active task)"}

        # Cancel the running task
        try:
            task.cancel()
            # Await the task to ensure cancellation propagates and cleanup in _race_loop runs
            await asyncio.wait_for(task, timeout=5.0)
        except asyncio.CancelledError:
            # expected path; task cancelled successfully
            logger.info(f"Race task {race_id} cancelled successfully.")
        except asyncio.TimeoutError:
            # If the task did not cancel in time, log and continue
            logger.warning(f"Timeout while waiting for race task {race_id} to cancel.")
        except Exception as e:
            logger.exception(f"Error while cancelling race task {race_id}: {e}")
        finally:
            # Clean up task record
            self.active_tasks.pop(race_id, None)
            race.status = RaceStatus.CANCELLED
            race.metadata["cancel_time"] = time.time()

        # Broadcast cancel event to clients (best-effort)
        cancel_event = {"event": "race-cancelled", "race_id": race_id, "timestamp": time.time()}
        try:
            await ws_manager.broadcast(race_id, cancel_event)
        except Exception:
            logger.debug("Failed to broadcast cancel event (no clients?)")

        return {"success": True, "message": "Race cancelled and task stopped."}
