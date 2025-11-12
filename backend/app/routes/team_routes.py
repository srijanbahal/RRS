# app/routes/team_routes.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from app.services.team_service import create_team, get_team_by_owner, get_team_by_id
from app.middleware.supabase_auth import verify_token

router = APIRouter(prefix="/teams", tags=["Teams"])


class TeamCreatePayload(BaseModel):
    name: str
    color: Optional[str] = None
    slug: Optional[str] = None
    bio: Optional[str] = None


@router.post("", summary="Create a team for the authenticated user")
async def create_team_endpoint(payload: TeamCreatePayload, req: Request, _=Depends(verify_token)):
    owner_id = req.state.user_id
    # check if owner already has a team
    existing = await get_team_by_owner(owner_id)
    if existing:
        raise HTTPException(status_code=400, detail="User already owns a team")

    try:
        team = await create_team(owner_id, payload.name, payload.color, payload.slug, payload.bio)
        return {"success": True, "team": team}
    except Exception as e:
        # bubble up error for now, but better to handle duplicate owner constraint
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", summary="Get current user's team")
async def get_my_team(req: Request, _=Depends(verify_token)):
    owner_id = req.state.user_id
    team = await get_team_by_owner(owner_id)
    if not team:
        return {"success": True, "team": None}
    return {"success": True, "team": team}


@router.get("/{team_id}", summary="Get team public info")
async def get_team(team_id: str):
    team = await get_team_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # For now, return team object. Later enforce private fields.
    return {"success": True, "team": team}
