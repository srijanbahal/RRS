import asyncio
from app.services.websocket_manager import ws_manager
# NOTE: This will later import LLMDecisionEngine from teammate’s file.

class RaceService:
    races = {}

    async def create_race(self, data):
        """
        # TODO (Srijan)
        Create a race and store minimal info in self.races dict.
        """
        race_id = str(len(self.races) + 1)
        self.races[race_id] = {
            "track": data.get("track", "DefaultTrack"),
            "laps": data.get("laps", 3),
            "agents": [],
            "status": "PENDING"
        }
        return {"race_id": race_id}

    async def register_agent(self, data):
        """
        # TODO (Srijan)
        Append new agent to race.
        """
        race_id = data["race_id"]
        agent = data["name"]
        self.races[race_id]["agents"].append(agent)
        return {"race_id": race_id, "agent": agent}

    async def start_race(self, race_id: str):
        """
        # TODO (Srijan)
        Start simulation loop and call teammate’s LLM engine later.
        """
        race = self.races[race_id]
        race["status"] = "ACTIVE"

        for lap in range(1, race["laps"] + 1):
            for agent in race["agents"]:
                # Temporary dummy decision; will call LLM later.
                decision = {"throttle": 0.7, "steer": 0.1, "brake": 0.0}
                telemetry = {
                    "agent": agent,
                    "lap": lap,
                    "speed": 200 + lap,
                    "decision": decision
                }
                await ws_manager.broadcast(race_id, telemetry)
            await asyncio.sleep(1)

        race["status"] = "FINISHED"
        return {"race_id": race_id, "status": "FINISHED"}
