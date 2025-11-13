import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware

# --- THIS IS THE FIX ---
# Load .env variables before anything else
from dotenv import load_dotenv
load_dotenv()
# --- END OF FIX ---

# Routers
from app.routes import (
    auth_test_routes,
    team_routes,
    agent_routes,
    room_routes,
    race_routes,
    telemetry_routes,
    ws_routes,
)

# Core services
from app.services.websocket_manager import ws_manager
from app.services.db import db
from app.middleware.supabase_auth import verify_token

logger = logging.getLogger("main")



# --------------------------------------------------------------------------
# Initialize app
# --------------------------------------------------------------------------
app = FastAPI(title="AI Grand Prix Backend", version="0.9.0")

# --------------------------------------------------------------------------
# Middleware & CORS
# --------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend domain(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Include Routers
# --------------------------------------------------------------------------
app.include_router(auth_test_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(team_routes.router, prefix="/teams", tags=["Teams"])
app.include_router(agent_routes.router, prefix="/agents", tags=["Agents"])
app.include_router(room_routes.router, prefix="/rooms", tags=["Rooms"])
app.include_router(race_routes.router, prefix="/races", tags=["Races"])
app.include_router(telemetry_routes.router, prefix="/telemetry", tags=["Telemetry"])
app.include_router(ws_routes.router, prefix="/ws", tags=["WebSocket"])

# --------------------------------------------------------------------------
# Health Check
# --------------------------------------------------------------------------
@app.get("/")
async def health():
    """Simple healthcheck endpoint."""
    return {"status": "ok", "message": "AI Grand Prix backend running"}


# --------------------------------------------------------------------------
# WebSocket — real-time race telemetry
# --------------------------------------------------------------------------
@app.websocket("/ws/race/{race_id}")
async def race_ws(websocket: WebSocket, race_id: str):
    """
    Handles real-time telemetry stream for a race.
    Requires query param: ?token=<JWT>
    """
    # --- Authenticate via Supabase token ---
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    user = await verify_token(token)
    if not user:
        await websocket.close(code=4003)
        return

    user_id = user.get("sub")
    team_id = user.get("team_id")
    role = user.get("role", "spectator")

    logger.info(f"WebSocket connected: user={user_id}, race={race_id}, role={role}")

    # --- Register connection and metadata ---
    await ws_manager.connect(websocket, race_id)
    ws_manager._ws_metadata[str(id(websocket))] = {
        "user_id": user_id,
        "team_id": team_id,
        "role": role,
        "allowed_entry_ids": [],
    }

    try:
        while True:
            # keep connection alive, optionally handle pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info(f"WebSocket disconnected: user={user_id}, race={race_id}")
    except Exception as e:
        ws_manager.disconnect(websocket)
        logger.warning(f"WebSocket error ({race_id}): {e}")


# --------------------------------------------------------------------------
# Startup & Shutdown Events
# --------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    logger.info("Connecting to Supabase / Postgres...")
    await db.connect()
    logger.info("Database connected.")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down backend...")
    await db.disconnect()
    await ws_manager.close_all()
    logger.info("Shutdown complete.")

