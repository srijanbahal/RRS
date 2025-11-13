# app/routes/agent_routes.py
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.middleware.supabase_auth import verify_token
from app.services import team_service, db
import json, uuid, logging
import app.services.agent_service as agent_service

router = APIRouter(tags=["Agents"])
logger = logging.getLogger(__name__)

class AgentCreatePayload(BaseModel):
    name: str
    type: Optional[str] = "LLM"
    provider: Optional[str] = None
    model: Optional[str] = None
    personality: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}

@router.post("", summary="Register an agent for the authenticated user's team")
async def create_agent(req: Request, payload: AgentCreatePayload, _=Depends(verify_token)):
    """Create an agent record for the authenticated user's team."""
    owner_user_id = req.state.user_id

    # Get the team for the logged-in user
    team = await team_service.get_team_by_owner(owner_user_id)
    if not team:
        raise HTTPException(status_code=400, detail="User has no team yet. Please create a team first.")

    agent_id = str(uuid.uuid4())
    config_json = json.dumps(payload.config or {})

    q = """
    INSERT INTO agents (id, team_id, name, type, provider, model, personality, config, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
    RETURNING id, team_id, name, type, provider, model, personality, config, created_at;
    """

    row = await db.fetchrow(
        q,
        agent_id,
        team["id"],
        payload.name,
        payload.type,
        payload.provider,
        payload.model,
        payload.personality,
        config_json,
    )

    return {"success": True, "agent": dict(row)}

@router.get("/me", summary="List agents for my team")
async def my_agents(req: Request, _=Depends(verify_token)):
    owner_user_id = req.state.user_id
    team = await team_service.get_team_by_owner(owner_user_id)
    if not team:
        return {"success": True, "agents": []}
    agents = await agent_service.list_agents_for_team(team["id"])
    return {"success": True, "agents": agents}