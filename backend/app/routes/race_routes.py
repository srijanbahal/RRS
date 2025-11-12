from fastapi import APIRouter, Depends, HTTPException, Request
from app.services import db, race_service
from app.auth.supabase_middleware import verify_token

router = APIRouter(prefix="/races", tags=["Races"])


@router.get("", summary="List all races")
async def list_races():
    q = """
    SELECT id, name, status, max_laps, created_at, start_time, end_time
    FROM races
    ORDER BY created_at DESC
    LIMIT 20;
    """
    rows = await db.fetch(q)
    return {"success": True, "races": [dict(r) for r in rows]}


@router.get("/{race_id}", summary="Get race details")
async def get_race(race_id: str):
    q = """
    SELECT id, name, status, max_laps, created_at, start_time, end_time
    FROM races
    WHERE id = $1;
    """
    row = await db.fetchrow(q, race_id)
    if not row:
        raise HTTPException(404, "Race not found")
    return {"success": True, "race": dict(row)}


@router.get("/{race_id}/leaderboard", summary="Get live leaderboard")
async def get_leaderboard(race_id: str):
    q = """
    SELECT re.id AS entry_id, t.name AS team_name, a.name AS agent_name, re.position, re.lap, re.speed
    FROM race_entries re
    JOIN teams t ON re.team_id = t.id
    JOIN agents a ON re.agent_id = a.id
    WHERE re.race_id = $1
    ORDER BY re.position ASC;
    """
    rows = await db.fetch(q, race_id)
    return {"success": True, "leaderboard": [dict(r) for r in rows]}


@router.post("/{race_id}/stop", summary="Stop race (admin only)")
async def stop_race(race_id: str, req: Request, _=Depends(verify_token)):
    res = await race_service.RaceService.instance().stop_race(race_id)
    return {"success": True, "message": f"Race {race_id} stopped", "result": res}


@router.get("/summary/dashboard", summary="Aggregated race + participant overview")
async def dashboard_summary():
    """
    Returns:
        - total active races
        - total finished races
        - total participants
        - recent top 3 races (with team counts)
    """
    q1 = "SELECT COUNT(*) FROM races WHERE status='ACTIVE';"
    q2 = "SELECT COUNT(*) FROM races WHERE status='FINISHED';"
    q3 = "SELECT COUNT(DISTINCT team_id) FROM race_entries;"
    q4 = """
        SELECT r.id, r.name, r.status, COUNT(re.id) as participants, r.created_at
        FROM races r
        LEFT JOIN race_entries re ON r.id = re.race_id
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT 3;
    """

    active = (await db.fetchval(q1)) or 0
    finished = (await db.fetchval(q2)) or 0
    participants = (await db.fetchval(q3)) or 0
    recent = [dict(r) for r in await db.fetch(q4)]

    return {
        "success": True,
        "stats": {
            "active_races": active,
            "finished_races": finished,
            "total_participants": participants,
            "recent_races": recent,
        }
    }