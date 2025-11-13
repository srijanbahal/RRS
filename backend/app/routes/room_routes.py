# app/routes/room_routes.py
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import logging
from app.middleware.supabase_auth import verify_token
from app.services import db
from app.services import team_service
from app.services.race_service import RaceService

logger = logging.getLogger("room_routes")
router = APIRouter(tags=["Rooms"])

race_service = RaceService()  # reuse single instance; ensure single import across app


class RoomCreatePayload(BaseModel):
    name: str
    circuit_id: Optional[str] = None
    max_players: int = 6
    is_private: Optional[bool] = False


class JoinPayload(BaseModel):
    agent_id: str
    car_id: Optional[str] = None


# Create a room
@router.post("", summary="Create a room (lobby)")
async def create_room(payload: RoomCreatePayload, req: Request, _=Depends(verify_token)):
    owner_team = await team_service.get_team_by_owner(req.state.user_id)
    if not owner_team:
        raise HTTPException(status_code=400, detail="User must create a team first")

    if payload.max_players < 2 or payload.max_players > 6:
        raise HTTPException(status_code=400, detail="max_players must be between 2 and 6")

    room_id = str(uuid.uuid4())
    query = """
    INSERT INTO rooms (id, name, creator_team_id, circuit_id, max_players, is_private, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'OPEN')
    RETURNING id, name, creator_team_id, circuit_id, max_players, is_private, status, created_at;
    """
    row = await db.fetchrow(query, room_id, payload.name, owner_team["id"], payload.circuit_id, payload.max_players, payload.is_private)
    return {"success": True, "room": dict(row)}


# Join a room
@router.post("/{room_id}/join", summary="Join a room with an agent and optional car")
async def join_room(room_id: str, payload: JoinPayload, req: Request, _=Depends(verify_token)):
    user_id = req.state.user_id
    team = await team_service.get_team_by_owner(user_id)
    if not team:
        raise HTTPException(status_code=400, detail="User must own a team to join as participant")

    # validate room exists and is open
    room = await db.fetchrow("SELECT * FROM rooms WHERE id = $1", room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room["status"] not in ("OPEN", "FULL"):
        raise HTTPException(status_code=400, detail=f"Cannot join room in status {room['status']}")

    # Validate agent belongs to this team
    agent = await db.fetchrow("SELECT * FROM agents WHERE id = $1 AND team_id = $2", payload.agent_id, team["id"])
    if not agent:
        raise HTTPException(status_code=403, detail="Agent not found or does not belong to your team")

    # Optional: validate car belongs to team if provided
    if payload.car_id:
        car = await db.fetchrow("SELECT * FROM cars WHERE id = $1 AND team_id = $2", payload.car_id, team["id"])
        if not car:
            raise HTTPException(status_code=403, detail="Car not found or does not belong to your team")

    # Check if already joined (unique constraint)
    existing = await db.fetchrow("SELECT * FROM room_participants WHERE room_id = $1 AND agent_id = $2", room_id, payload.agent_id)
    if existing:
        raise HTTPException(status_code=400, detail="Agent already joined this room")

    # Insert participant
    participant_id = str(uuid.uuid4())
    q = """
    INSERT INTO room_participants (id, room_id, team_id, agent_id, car_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, room_id, team_id, agent_id, car_id, joined_at;
    """
    row = await db.fetchrow(q, participant_id, room_id, team["id"], payload.agent_id, payload.car_id)

    # Count participants
    cnt_row = await db.fetchrow("SELECT COUNT(*) as cnt FROM room_participants WHERE room_id = $1", room_id)
    current_count = cnt_row["cnt"] if cnt_row else 0

    # Update room status to FULL if reached
    if current_count >= room["max_players"]:
        await db.execute("UPDATE rooms SET status='FULL' WHERE id = $1", room_id)

        # Auto-create race and start
        # 1) create race entry in DB
        race_id = str(uuid.uuid4())
        race_name = f"{room['name']}-auto"
        create_race_q = """
        INSERT INTO races (id, room_id, name, circuit_id, max_laps, status, start_time)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now())
        RETURNING id, name, status, start_time;
        """
        # default max_laps: maybe put in room.metadata later
        max_laps = 3
        race_row = await db.fetchrow(create_race_q, race_id, room_id, race_name, room["circuit_id"], max_laps)

        # 2) select all participants and create race_entries
        participants = await db.fetch("SELECT * FROM room_participants WHERE room_id = $1 ORDER BY joined_at", room_id)
        insert_entry_q = """
        INSERT INTO race_entries (id, race_id, team_id, agent_id, car_id, status, lap, total_distance)
        VALUES ($1, $2, $3, $4, $5, 'PENDING', 0, 0.0)
        RETURNING id;
        """
        entry_rows = []
        for p in participants:
            entry_id = str(uuid.uuid4())
            r = await db.fetchrow(insert_entry_q, entry_id, race_id, p["team_id"], p["agent_id"], p["car_id"])
            entry_rows.append(r)

        # 3) Now create the in-memory race via RaceService using same race_id
        # Prepare data to pass to RaceService.create_race
        race_data = {
            "id": race_id,                    # ensure in-memory id === DB id
            "name": race_name,
            "trackId": room["circuit_id"],
            "maxLaps": max_laps,
            "teams": [ { "agent_id": p["agent_id"], "team_id": p["team_id"], "car_id": p["car_id"] } for p in participants ]
        }
        # create the in-memory race
        mem_race = await race_service.create_race(race_data)
        # start it
        await race_service.start_race(race_id)

    return {"success": True, "participant": dict(row), "current_count": current_count}
