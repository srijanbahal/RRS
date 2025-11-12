# app/services/agent_service.py
import uuid
import logging
from typing import Optional, Dict, Any, List
from app.services import db

logger = logging.getLogger("agent_service")


async def create_agent(team_id: str, name: str, type_: str = "LLM", provider: Optional[str] = None,
                       model: Optional[str] = None, personality: Optional[str] = None,
                       config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create an agent record for a team.
    """
    config_json = config or {}
    agent_id = str(uuid.uuid4())
    q = """
    INSERT INTO agents (id, team_id, name, type, provider, model, personality, config, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
    RETURNING id, team_id, name, type, provider, model, personality, config, created_at;
    """
    row = await db.fetchrow(q, agent_id, team_id, name, type_, provider, model, personality, config_json)
    return dict(row)


async def get_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    q = "SELECT id, team_id, name, type, provider, model, personality, config, created_at FROM agents WHERE id = $1"
    row = await db.fetchrow(q, agent_id)
    return dict(row) if row else None


async def list_agents_for_team(team_id: str) -> List[Dict[str, Any]]:
    q = "SELECT id, team_id, name, type, provider, model, personality, config, created_at FROM agents WHERE team_id = $1 ORDER BY created_at DESC"
    rows = await db.fetch(q, team_id)
    return [dict(r) for r in rows]
