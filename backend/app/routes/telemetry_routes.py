from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.telemetry_service import telemetry_svc

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.get("/{race_id}", summary="Get latest telemetry for a race")
async def get_latest_telemetry(race_id: str, limit: Optional[int] = 50):
    data = await telemetry_svc.get_latest(race_id, limit)
    if not data:
        raise HTTPException(404, "No telemetry found for this race.")
    return {"success": True, "race_id": race_id, "count": len(data), "telemetry": data}


@router.get("/{race_id}/{entry_id}", summary="Get latest telemetry for a specific car/entry")
async def get_entry_telemetry(race_id: str, entry_id: str, limit: Optional[int] = 20):
    data = await telemetry_svc.get_last_n_for_entry(race_id, entry_id, n=limit)
    if not data:
        raise HTTPException(404, "No telemetry found for this entry.")
    return {"success": True, "entry_id": entry_id, "count": len(data), "telemetry": data}
    