# app/routes/ws_routes.py (updated connect section snippet)
from fastapi import APIRouter, WebSocket
from app.middleware.supabase_auth import verify_ws_token
from app.services.websocket_manager import ws_manager
from app.services import db

router = APIRouter()

@router.websocket("/ws/race/{race_id}")
async def race_ws_endpoint(websocket: WebSocket, race_id: str):
    # verify token and get user info
    try:
        user = await verify_ws_token(websocket)  # returns dict {"user_id":..., "role":...}
    except Exception as e:
        # verify_ws_token will close websocket if invalid; just return
        return

    user_id = user["user_id"]
    role = user.get("role", "spectator")

    # fetch team for this user (if any)
    team_row = await db.fetchrow("SELECT id FROM teams WHERE owner_id = $1", user_id)
    team_id = team_row["id"] if team_row else None

    # compute allowed_entry_ids: entries for races where team_id matches
    allowed_entry_ids = []
    if team_id:
        rows = await db.fetch("SELECT re.id FROM race_entries re WHERE re.race_id = $1 AND re.team_id = $2", race_id, team_id)
        allowed_entry_ids = [r["id"] for r in rows]

    metadata = {
        "user_id": user_id,
        "role": role,
        "team_id": team_id,
        "allowed_entry_ids": allowed_entry_ids
    }

    # register connection with metadata
    await ws_manager.connect(websocket, race_id, metadata=metadata)

    try:
        while True:
            msg = await websocket.receive_text()
            # handle ping or simple messages if needed
            if msg.lower() == "ping":
                await websocket.send_text("pong")
    except Exception:
        ws_manager.disconnect(websocket)
