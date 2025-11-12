# app/services/team_service.py
from typing import Optional, Dict, Any
from app.services import db
import uuid
import logging

logger = logging.getLogger("team_service")


async def create_team(owner_id: str, name: str, color: str = None, slug: str = None, bio: str = None) -> Dict[str, Any]:
    """
    Create a team. Enforces UNIQUE(owner_id) at DB level.
    Returns the created team row as dict.
    """
    team_id = str(uuid.uuid4())
    query = """
    INSERT INTO teams (id, owner_id, name, slug, color, bio)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, owner_id, name, slug, color, bio, created_at;
    """
    try:
        row = await db.fetchrow(query, team_id, owner_id, name, slug, color, bio)
        if row:
            return dict(row)
    except Exception as e:
        logger.exception("create_team failed")
        raise e


async def get_team_by_owner(owner_id: str) -> Optional[Dict]:
    query = """
    SELECT id, owner_id, name, slug, color, bio, created_at
    FROM teams
    WHERE owner_id = $1
    LIMIT 1
    """
    row = await db.fetchrow(query, owner_id)
    return dict(row) if row else None


async def get_team_by_id(team_id: str) -> Optional[Dict]:
    query = """
    SELECT id, owner_id, name, slug, color, bio, created_at
    FROM teams
    WHERE id = $1
    """
    row = await db.fetchrow(query, team_id)
    return dict(row) if row else None
