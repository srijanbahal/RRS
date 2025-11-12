"""
Race Routes — Exposes REST endpoints for AI Grand Prix races.

Endpoints:
  POST   /races            → create a new race
  POST   /agents           → register an agent/driver for a race and assign car to them
  POST   /races/{id}/start → start race loop (async)
  POST   /races/{id}/stop  → cancel a running race
  GET    /races/{id}       → get race details
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.services.race_service import RaceService
from app.models.race_model import RaceStatus

# Single shared service instance
race_service = RaceService()

router = APIRouter(prefix="/races", tags=["Races"])


# ----------------------------------------------------------------------
# 1️. Create Race
# ----------------------------------------------------------------------
@router.post("", summary="Create a new race")
async def create_race_endpoint(payload: dict):
    """
    Create a new race.

    Example payload:
    {
      "name": "Monaco GP",
      "laps": 5,
      "circuit": { "name": "Monaco", "track_length": 5200.0 }
    }
    """
    try:
        result = await race_service.create_race(payload)
        return JSONResponse(content=result, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------------------------------------
# 2️. Register Agent (Driver)
# ----------------------------------------------------------------------
@router.post("/agents", summary="Register a new agent for a race")
async def register_agent_endpoint(payload: dict):
    """
    Register a driver/agent for an existing race.

    Example payload:
    {
      "race_id": "<uuid>",
      "name": "RedBullAI",
      "personality": "aggressive",
      "team": "RedBull"
    }
    """
    try:
        result = await race_service.register_agent(payload)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Invalid request"))
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------------------------------------
# 3️. Start Race
# ----------------------------------------------------------------------
@router.post("/{race_id}/start", summary="Start a race loop")
async def start_race_endpoint(race_id: str):
    """
    Start the race loop asynchronously for the given race.
    """
    try:
        result = await race_service.start_race(race_id)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Cannot start race"))
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------------------------------------
# 4️. Stop Race
# ----------------------------------------------------------------------
@router.post("/{race_id}/stop", summary="Stop or cancel a running race")
async def stop_race_endpoint(race_id: str):
    """
    Stop (cancel) an active race loop.
    """
    try:
        result = await race_service.stop_race(race_id)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to stop race"))
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------------------------------------
# 5. Get Race State / Details
# ----------------------------------------------------------------------
@router.get("/{race_id}", summary="Get current race state")
async def get_race_state_endpoint(race_id: str):
    """
    Retrieve current race info (cars, laps, status).
    """
    if race_id not in race_service.races:
        raise HTTPException(status_code=404, detail="Race not found")

    race = race_service.races[race_id]
    race_data = race.to_dict() if hasattr(race, "to_dict") else {
        "id": race.id,
        "name": race.name,
        "laps": race.max_laps,
        "status": race.status,
        "cars": list(race.cars.keys()),
        "created_at": str(race.created_at)
    }

    return JSONResponse(content={
        "success": True,
        "race": race_data
    })
