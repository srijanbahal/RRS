# File: app/routes/circuit_routes.py
from fastapi import APIRouter, HTTPException
from app.services import db
import logging

# Note: Prefix is added in main.py, tag is for docs
router = APIRouter(tags=["Circuits"])
logger = logging.getLogger(__name__)

@router.get("", summary="List all available circuits")
async def list_circuits():
    """
    Fetches all circuits from the database to populate UI dropdowns.
    """
    try:
        rows = await db.fetch(
            "SELECT id, name, track_length_m, description FROM circuits ORDER BY name"
        )
        return {"success": True, "circuits": [dict(r) for r in rows]}
    except Exception as e:
        logger.exception(f"Failed to list circuits: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch circuits")