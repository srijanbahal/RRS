#  inside app/services/race_service.py
import asyncio
import time
import uuid
from typing import Dict, List, Any
import logging
import math

from app.services import db
from app.services.websocket_manager import ws_manager
from app.services.llm_engine import LLMDecisionEngine

# Import your domain models - adapt imports to your repo layout
from app.models.race_model import Race, RaceStatus
from app.models.cars_model import Car
from app.models.agent_model import Agent
from app.models.circuit_model import Circuit
from app.models.telemetry_model import Telemetry
from app.services.telemetry_service import telemetry_svc

import json

logger = logging.getLogger("RaceService")

# Buffer config for telemetry persistence
TELEMETRY_BATCH_SIZE = 50
TELEMETRY_FLUSH_INTERVAL = 2.0  # seconds


class RaceService:
    def __init__(self):
        self.races: Dict[str, Race] = {}
        self.tick_interval: float = 1.0
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self._llm = LLMDecisionEngine()
        # telemetry buffer per race_id
        self._telemetry_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self._telemetry_flush_locks: Dict[str, asyncio.Lock] = {}

    # -----------------------------------------------------------------------
    # Create Race (DB-aware) - accepts provided id if present
    # -----------------------------------------------------------------------
    async def create_race(self, data: dict) -> dict:
        """
        Create an in-memory Race and ensure DB row exists.
        data may contain:
          - id (uuid) [optional]
          - name
          - trackId / circuit_id
          - maxLaps / max_laps
          - teams: list of { agent_id, team_id, car_id } entries (from room participants)
        Behavior:
          - If a races DB row exists for given id -> use it
          - Else create a DB race and race_entries
          - Construct an in-memory Race object with same id
        Returns the in-memory race summary dict.
        """
        # normalize input
        race_id = data.get("id") or str(uuid.uuid4())
        name = data.get("name") or data.get("race_name") or f"Race-{race_id[:8]}"
        circuit_id = data.get("trackId") or data.get("circuit_id") or data.get("circuit") or None
        max_laps = int(data.get("maxLaps") or data.get("max_laps") or 3)
        participants = data.get("teams") or data.get("participants") or []

        # Check DB: does race exist?
        db_race = await db.fetchrow("SELECT * FROM races WHERE id = $1", race_id)
        if not db_race:
            # create DB race row (status PENDING initially)
            insert_q = """
            INSERT INTO races (id, room_id, name, circuit_id, max_laps, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 'PENDING', now())
            RETURNING id, name, status, circuit_id, max_laps;
            """
            # room_id unknown here - pass None
            db_race = await db.fetchrow(insert_q, race_id, None, name, circuit_id, max_laps)
            logger.info(f"Inserted DB race {race_id}")

        # Ensure race_entries exist for participants:
        # If participants provided (room flow), create missing entries.
        existing_entries = await db.fetch("SELECT id, agent_id, team_id, car_id FROM race_entries WHERE race_id = $1", race_id)
        existing_map = {r["agent_id"]: r for r in existing_entries} if existing_entries else {}

        # If participants provided through teams list, create missing entries
        created_entry_ids = []
        if participants:
            for p in participants:
                agent_id = p.get("agent_id")
                team_id = p.get("team_id")
                car_id = p.get("car_id")
                if agent_id in existing_map:
                    created_entry_ids.append(existing_map[agent_id]["id"])
                    continue
                entry_id = str(uuid.uuid4())
                q = """
                INSERT INTO race_entries (id, race_id, team_id, agent_id, car_id, status, lap, total_distance, created_at)
                VALUES ($1, $2, $3, $4, $5, 'PENDING', 0, 0.0, now())
                RETURNING id;
                """
                row = await db.fetchrow(q, entry_id, race_id, team_id, agent_id, car_id)
                created_entry_ids.append(row["id"])
            logger.info(f"Created {len(created_entry_ids)} race_entries for race {race_id}")
        else:
            # if none provided, and no entries exist, we leave it to room flow or callers to create entries
            pass

        # Build in-memory Race object
        # Fetch race_entries to build cars
        entries = await db.fetch("SELECT re.id as entry_id, re.agent_id, re.team_id, re.car_id, a.model as agent_model, a.type as agent_type FROM race_entries re LEFT JOIN agents a ON re.agent_id = a.id WHERE re.race_id = $1", race_id)
        # instantiate circuit (lightweight)
        circuit = None
        if db_race and db_race.get("circuit_id"):
            circ_row = await db.fetchrow("SELECT * FROM circuits WHERE id = $1", db_race["circuit_id"])
            if circ_row:
                circuit = Circuit(
                    name=circ_row.get("name"),
                    track_length=circ_row.get("track_length_m") or circ_row.get("track_length") or 5000.0
                )
        # Create Race model instance (adapt to your Race constructor)
        race_obj = Race(
            id=race_id,
            name=db_race.get("name") if db_race else name,
            max_laps=db_race.get("max_laps") if db_race else max_laps,
            circuit=circuit,
            status=RaceStatus.PENDING
        )

        # Add cars to race (in-memory) - we create Car objects for each entry
        for e in entries:
            # Fetch agent metadata if needed
            agent_row = await db.fetchrow("SELECT * FROM agents WHERE id = $1", e["agent_id"])
            car_row = None
            if e["car_id"]:
                car_row = await db.fetchrow("SELECT * FROM cars WHERE id = $1", e["car_id"])
            # instantiate agent & car models (adapt to your constructors)
            agent = Agent(
                id=e["agent_id"],
                name=(agent_row.get("name") if agent_row else f"agent-{e['agent_id'][:6]}"),
                teamId=e.get("team_id"),
                model=(agent_row.get("model") if agent_row else None),
                personality=(agent_row.get("personality") if agent_row else None),
                config=(agent_row.get("config") if agent_row else {})
            )
            car = Car(
                id=str(uuid.uuid4()),
                agent_id=agent.id,
                team_id=e.get("team_id"),
                position=(0.0, 0.0),
                velocity=(0.0, 0.0),
                speed=0.0,
                lap=0,
                lap_distance=0.0,
                status="RUNNING",
                config=(car_row.get("config") if car_row else {}),
                created_at=time.time()
            )
            # register agent/car into race's internal structures
            race_obj.add_car(car)  # assumes Race has add_car method

        # Store in-memory race
        self.races[race_id] = race_obj
        # init telemetry buffer and lock
        self._telemetry_buffers[race_id] = []
        self._telemetry_flush_locks[race_id] = asyncio.Lock()

        logger.info(f"RaceService: created in-memory race {race_id} with {len(entries)} entries")
        return {
            "success": True,
            "race_id": race_id,
            "in_memory": True,
            "db": dict(db_race) if db_race else None
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
          • Validate race exists (in DB and in-memory)
          • Change DB race status → ACTIVE
          • Change in-memory race status → ACTIVE
          • Create asyncio background task for race loop
          • Store the task reference (for cancellation later)
        """
        # Check DB race exists
        db_row = await db.fetchrow("SELECT id, status FROM races WHERE id = $1", race_id)
        if not db_row:
            return {"success": False, "error": "race_not_found"}

        # Check in-memory race exists (we expect create_race called earlier to populate self.races)
        if race_id not in self.races:
            # If DB row exists but in-memory race not created, try to create in-memory race from DB
            # (you could call create_race with participants previously created).
            return {"success": False, "error": "race_not_loaded_in_memory"}

        race = self.races[race_id]

        # Prevent restarting a finished/cancelled race
        if db_row["status"] in ("ACTIVE", "FINISHED", "CANCELLED"):
            return {"success": False, "message": f"Cannot start race in DB state '{db_row['status']}'."}

        # Update DB status to ACTIVE and set start_time if null
        try:
            await db.execute("UPDATE races SET status='ACTIVE', start_time = COALESCE(start_time, now()) WHERE id = $1", race_id)
        except Exception as e:
            logger.exception(f"Failed to mark race active in DB: {e}")
            return {"success": False, "error": "db_update_failed"}

        # Update in-memory status
        race.status = RaceStatus.ACTIVE

        # Create background task
        loop = asyncio.get_event_loop()
        race_task = loop.create_task(self._race_loop(race_id))
        self.active_tasks[race_id] = race_task

        logger.info(f"Race {race.name} ({race_id}) started with {len(race.cars)} cars.")
        return {"success": True, "race_id": race_id, "message": f"Race '{race.name}' started successfully.", "status": race.status}
    
    
    # -----------------------------------------------------------------------
    # Race Loop (core simulation logic) - DB persistence + filtered broadcasts
    # -----------------------------------------------------------------------
    async def _race_loop(self, race_id: str):
        """
        Main async race simulation loop:
        - On start: mark DB race status ACTIVE and start_time (if not set)
        - Each tick: for each car, build state, call LLMDecisionEngine.decide(), apply decision, produce telemetry
        - Broadcast public telemetry to all; send private telemetry to team owners (based on ws metadata)
        - Buffer telemetry and flush to DB in batches
        """
        if race_id not in self.races:
            logger.error(f"_race_loop: race {race_id} not found in memory")
            return

        race = self.races[race_id]
        # set DB race status/start_time if not already ACTIVE
        try:
            await db.execute("UPDATE races SET status='ACTIVE', start_time = COALESCE(start_time, now()) WHERE id = $1", race_id)
        except Exception as e:
            logger.exception(f"Failed to update DB race start_time/status: {e}")

        logger.info(f"Race loop starting for {race.name} ({race_id})")

        # helper to flush telemetry buffer
        async def flush_telemetry_buffer():
            buffer = self._telemetry_buffers.get(race_id, [])
            if not buffer:
                return
            async with self._telemetry_flush_locks[race_id]:
                buf = list(self._telemetry_buffers.get(race_id, []))
                self._telemetry_buffers[race_id].clear()
            # batch insert
            q = """
            INSERT INTO telemetry (race_id, entry_id, car_id, ts, tick_interval_ms, lap, speed, position, orientation, decision, sample)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb)
            """
            args_list = []
            for t in buf:
                args_list.append((
                    t["race_id"],
                    t.get("entry_id"),
                    t.get("car_id"),
                    t.get("ts"),
                    int((t.get("tick_interval_ms") or 0)),
                    int(t.get("lap") or 0),
                    float(t.get("speed") or 0.0),
                    json.dumps(t.get("position") or {}),
                    float(t.get("orientation") or 0.0),
                    json.dumps({"decision": t.get("decision"), "extra": t.get("sample_extra", {})})
                ))
            try:
                await db.executemany(q, args_list)
            except Exception as e:
                logger.exception(f"Failed to batch insert telemetry for race {race_id}: {e}")

        # main loop
        try:
            last_flush = time.time()
            while race.status == RaceStatus.ACTIVE:
                # snapshot cars to avoid mutation during loop
                car_items = list(race.cars.items())
                if not car_items:
                    logger.info(f"No cars in race {race_id}, ending.")
                    race.status = RaceStatus.FINISHED
                    break

                # For each car sequentially (you may parallelize later)
                for car_id, car in car_items:
                    # skip non-running cars
                    if getattr(car, "status", None) not in ("RUNNING", None):
                        continue

                    # build state for LLM
                    try:
                        state = await self._build_state(race, car)
                    except Exception:
                        state = {
                            "race": {"id": race_id, "lap": car.lap, "max_laps": race.max_laps},
                            "car": {"speed": getattr(car, "speed", 0.0), "position": getattr(car, "position", (0, 0))}
                        }

                    # LLM decision with timeout
                    decision = {"throttle": 0.5, "steer": 0.0, "brake": 0.0}
                    try:
                        decision = await asyncio.wait_for(self._llm.decide(state), timeout=3.0)
                    except asyncio.TimeoutError:
                        logger.warning(f"LLM timeout for car {car_id} in race {race_id}")
                    except Exception as e:
                        logger.warning(f"LLM error for car {car_id}: {e}")
                        
                    try:
                        asyncio.create_task(db.execute(
                            "INSERT INTO llm_logs (race_id, entry_id, ts, input_state, raw_response, parsed_decision, provider, model) VALUES ($1,$2,now(), $3::jsonb, $4::jsonb, $5::jsonb, $6, $7)",
                            race_id, getattr(car, "entry_id", None), json.dumps(state), json.dumps({}), json.dumps(decision), self._llm.provider, self._llm.model
                        ))
                    except Exception as e:
                        logger.debug("Failed to async insert llm_logs: %s", e)

                    # apply decision to car (assumes car.apply_decision updates speed/position/etc)
                    try:
                        car.apply_decision(decision, dt=self.tick_interval)
                    except Exception as e:
                        logger.exception(f"Error applying decision to car {car_id}: {e}")
                        car.status = "CRASHED"

                    # lap / distance logic (simple)
                    if hasattr(race, "circuit") and getattr(race, "circuit", None):
                        try:
                            if car.lap_distance >= race.circuit.track_length:
                                car.lap += 1
                                car.lap_distance -= race.circuit.track_length
                                # broadcast lap event
                                lap_event = {"event": "lap-complete", "race_id": race_id, "car_id": car.id, "lap": car.lap, "timestamp": time.time()}
                                await ws_manager.broadcast(race_id, lap_event)
                                if car.lap > race.max_laps:
                                    car.status = "FINISHED"
                        except Exception:
                            pass

                    # build telemetry packet (full)
                    telemetry_obj = {
                        "race_id": race_id,
                        "entry_id": getattr(car, "entry_id", None),  # if you set entry_id on car earlier
                        "car_id": car.id,
                        "agent_id": getattr(car, "agent_id", None),
                        "lap": getattr(car, "lap", 0),
                        "speed": getattr(car, "speed", 0.0),
                        "position": getattr(car, "position", (0.0, 0.0)),
                        "orientation": getattr(car, "orientation", 0.0),
                        "fuel": getattr(car, "fuel", None),
                        "tire_wear": getattr(car, "tire_wear", None),
                        "decision": decision,
                        "timestamp": time.time(),
                        "tick_interval_ms": int(self.tick_interval * 1000)
                    }

                    await telemetry_svc.record(race_id, telemetry_obj)
                    
                    # 1) PUBLIC telemetry: send generic fields to everyone
                    public_payload = {
                        "event": "telemetry-update",
                        "race_id": race_id,
                        "car_id": telemetry_obj["car_id"],
                        "agent_id": telemetry_obj["agent_id"],
                        "position": telemetry_obj["position"],
                        "speed": telemetry_obj["speed"],
                        "lap": telemetry_obj["lap"],
                        "timestamp": telemetry_obj["timestamp"]
                    }
                    await ws_manager.broadcast(race_id, public_payload)

                    # 2) PRIVATE telemetry: send to owners / allowed sockets only
                    private_payload = {
                        "event": "telemetry-update-private",
                        **public_payload,
                        "fuel": telemetry_obj.get("fuel"),
                        "tire_wear": telemetry_obj.get("tire_wear"),
                        "decision": telemetry_obj.get("decision")
                    }

                    # iterate connections and send private payload to allowed ones
                    conns = ws_manager.list_connections(race_id)
                    for ws in conns:
                        meta = ws_manager._ws_metadata.get(str(id(ws))) if hasattr(ws_manager, "_ws_metadata") else {}
                        if not meta:
                            continue
                        # team owner or allowed_entry_ids
                        if meta.get("team_id") and meta["team_id"] == getattr(car, "team_id", None):
                            await ws_manager.send_to(race_id, ws, private_payload)
                        elif telemetry_obj.get("entry_id") and telemetry_obj.get("entry_id") in meta.get("allowed_entry_ids", []):
                            await ws_manager.send_to(race_id, ws, private_payload)

                    # Buffer telemetry for DB persistence
                    self._telemetry_buffers.setdefault(race_id, []).append(telemetry_obj)
                    # flush if buffer large
                    if len(self._telemetry_buffers[race_id]) >= TELEMETRY_BATCH_SIZE or (time.time() - last_flush) >= TELEMETRY_FLUSH_INTERVAL:
                        await flush_telemetry_buffer()
                        last_flush = time.time()

                # check finish condition: all cars finished or no running cars
                entries_status = [getattr(c, "status", None) for _, c in race.cars.items()]
                if all(s in ("FINISHED", "CRASHED") for s in entries_status):
                    race.status = RaceStatus.FINISHED
                    break

                await asyncio.sleep(self.tick_interval)

            # loop exit: mark DB race finished if not already
            try:
                await db.execute("UPDATE races SET status=$1, end_time = COALESCE(end_time, now()) WHERE id = $2", race.status, race_id)
            except Exception as e:
                logger.exception(f"Failed to update DB race end: {e}")

            # final flush
            await flush_telemetry_buffer()

        except asyncio.CancelledError:
            race.status = RaceStatus.CANCELLED
            try:
                await db.execute("UPDATE races SET status='CANCELLED', end_time = now() WHERE id = $1", race_id)
            except Exception:
                pass
            logger.info(f"Race {race_id} cancelled.")
            raise
        except Exception as e:
            logger.exception(f"Unhandled exception in _race_loop for race {race_id}: {e}")
            try:
                await db.execute("UPDATE races SET status='CANCELLED', metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', to_jsonb($1::text)) WHERE id = $2", str(e), race_id)
            except Exception:
                pass
        finally:
            # cleanup active_tasks if present
            if race_id in self.active_tasks:
                self.active_tasks.pop(race_id, None)

            # make sure final state is set
            if race.status not in (RaceStatus.FINISHED, RaceStatus.CANCELLED):
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
    # 6️. Optional: Stop / Cancel Race
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
