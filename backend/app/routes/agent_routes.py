# app/routes/agent_routes.py
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.supabase_auth import verify_token
from app.services import team_service, agent_service

router = APIRouter(prefix="/agents", tags=["Agents"])


class AgentCreatePayload(BaseModel):
    name: str
    type: Optional[str] = "LLM"
    provider: Optional[str] = None
    model: Optional[str] = None
    personality: Optional[str] = None
    config: Optional[dict] = None


@router.post("", summary="Register an agent for the authenticated user's team")
async def register_agent(payload: AgentCreatePayload, req: Request, _=Depends(verify_token)):
    owner_user_id = req.state.user_id
    # ensure user owns a team
    team = await team_service.get_team_by_owner(owner_user_id)
    if not team:
        raise HTTPException(status_code=400, detail="Create a team first")

    try:
        agent = await agent_service.create_agent(
            team_id=team["id"],
            name=payload.name,
            type_=payload.type,
            provider=payload.provider,
            model=payload.model,
            personality=payload.personality,
            config=payload.config
        )
        return {"success": True, "agent": agent}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", summary="List agents for my team")
async def my_agents(req: Request, _=Depends(verify_token)):
    owner_user_id = req.state.user_id
    team = await team_service.get_team_by_owner(owner_user_id)
    if not team:
        return {"success": True, "agents": []}
    agents = await agent_service.list_agents_for_team(team["id"])
    return {"success": True, "agents": agents}
