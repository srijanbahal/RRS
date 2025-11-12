from fastapi import APIRouter
from app.services.race_service import RaceService

router = APIRouter()
race_service = RaceService()

@router.post("/")
async def register_agent(data: dict):
    """
    # TODO (Srijan)
    Register a new agent for a race.
    """
    return await race_service.register_agent(data)
