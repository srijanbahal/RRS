from fastapi import FastAPI, WebSocket
from app.api import routes_race, routes_agent, routes_telemetry, ws_routes
from app.routes import auth_test_routes
from app.services.websocket_manager import ws_manager

app = FastAPI(title="AI Grand Prix Backend")

# Include routers
app.include_router(auth_test_routes.router)
app.include_router(routes_race.router, prefix="/races", tags=["Races"])
app.include_router(routes_agent.router, prefix="/agents", tags=["Agents"])
app.include_router(routes_telemetry.router, prefix="/telemetry", tags=["Telemetry"])
app.include_router(ws_routes.router, prefix="/ws", tags=["WebSocket"])


@app.get("/")
def health():
    return {"status": "ok"}

@app.websocket("/ws/race/{race_id}")
async def race_ws(websocket: WebSocket, race_id: str):
    """Handles real-time race telemetry"""
    await ws_manager.connect(websocket, race_id)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except Exception:
        ws_manager.disconnect(websocket)
