from fastapi import APIRouter
from app.services.race_service import RaceService

router = APIRouter()
race_service = RaceService()

@router.post("/")
async def create_race(data: dict):
    """
    # TODO (Srijan)
    Create a new race entry and return its ID.
    """
    return await race_service.create_race(data)

@router.post("/{race_id}/start")
async def start_race(race_id: str):
    """
    # TODO (Srijan)
    Starts race loop, triggers agent decisions, emits telemetry.
    """
    return await race_service.start_race(race_id)
