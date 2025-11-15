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


# async def get_team_by_owner(owner_id: str) -> Optional[Dict]:
#     query = """
#     SELECT id, owner_id, name, slug, color, bio, created_at
#     FROM teams
#     WHERE owner_id = $1
#     LIMIT 1
#     """
#     row = await db.fetchrow(query, owner_id)
#     return dict(row) if row else None


async def get_team_by_id(team_id: str) -> Optional[Dict]:
    query = """
    SELECT id, owner_id, name, slug, color, bio, created_at
    FROM teams
    WHERE id = $1
    """
    row = await db.fetchrow(query, team_id)
    return dict(row) if row else None


async def get_team_by_owner(owner_id: str) -> Optional[Dict]:
    # 1. Get the core team info
    team_query = """
    SELECT id, owner_id, name, slug, color, bio, created_at
    FROM teams
    WHERE owner_id = $1
    LIMIT 1
    """
    team_row = await db.fetchrow(team_query, owner_id)
    if not team_row:
        return None

    team = dict(team_row)
    team_id = team["id"]

    # --- 2. ENHANCEMENT: Get Team Stats ---
    
    # Query for total races participated in
    races_query = "SELECT COUNT(DISTINCT race_id) as count FROM race_entries WHERE team_id = $1"
    races_row = await db.fetchrow(races_query, team_id)
    team["races"] = races_row["count"] if races_row else 0
    
    # Query for wins (position = 1)
    wins_query = """
    SELECT COUNT(*) as count 
    FROM race_results rr
    JOIN race_entries re ON rr.entry_id = re.id
    WHERE re.team_id = $1 AND rr.position = 1
    """
    wins_row = await db.fetchrow(wins_query, team_id)
    team["wins"] = wins_row["count"] if wins_row else 0

    # Rank (this is complex, mocking for now)
    team["rank"] = 12 # TODO: Implement real ranking query
    
    # --- 3. ENHANCEMENT: Get Analytics (Mocked for now) ---
    # These stats (overtakes, avg lap) are complex to query in real-time.
    # A real-world solution would pre-calculate this or use an analytics DB.
    # For now, we'll return the same mock data your frontend expects.
    team["analytics"] = {
        "overtakes": 34,
        "avgLapTime": 92.4,
        "winRate": 16.7,
        "pitStops": 8
    }

    return team
    # --- END OF ENHANCEMENTS ---