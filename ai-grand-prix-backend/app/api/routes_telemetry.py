from fastapi import APIRouter

router = APIRouter()

@router.get("/{race_id}")
async def get_race_telemetry(race_id: str):
    """
    # TODO (Teammate)
    Return latest telemetry snapshots for a given race.
    (Later: from MongoDB or in-memory cache)
    """
    return {"race_id": race_id, "telemetry": []}
