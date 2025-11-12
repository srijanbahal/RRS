# app/routes/ws_routes.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse
from typing import Optional
from app.services.websocket_manager import ws_manager
import logging

router = APIRouter()
logger = logging.getLogger("ws_routes")


@router.websocket("/ws/race/{race_id}")
async def race_ws_endpoint(websocket: WebSocket, race_id: str, role: Optional[str] = None):
    """
    WebSocket endpoint for race telemetry and events.

    - Clients should connect to: ws://HOST/ws/race/{race_id}
    - Optional query param `role` can be used (e.g., ?role=spectator or ?role=team)
    - This handler:
        1. Accepts and registers the websocket with ws_manager.
        2. Keeps the connection alive, echoing pings or handling simple commands.
        3. On disconnect, removes the connection from ws_manager.

    Example connection:
        ws://localhost:8000/ws/race/abcd-1234?role=spectator
    """

    # Accept and register connection
    await ws_manager.connect(websocket, race_id)
    logger.info(f"WebSocket client connected for race {race_id}, role={role}")

    try:
        # Optionally, send an initial handshake message
        await websocket.send_json({
            "event": "ws-connected",
            "race_id": race_id,
            "role": role or "unknown",
        })


        # Listen for incoming messages from client (keep-alive, simple commands)
        while True:
            try:
                msg = await websocket.receive_text()
            except WebSocketDisconnect:
                # Let outer except block handle disconnect cleanup
                raise

            # Simple protocol: handle ping or admin commands (expand as needed)
            if not msg:
                continue

            # Basic ping-pong
            if msg.lower() in ("ping", "ping\n", "Ping"):
                await websocket.send_text("pong")
                continue

            # If client sends JSON commands, you can parse and react here.
            # For now we just log and echo.
            logger.debug(f"Received from client (race={race_id}): {msg}")
            await websocket.send_text(f"echo: {msg}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: race={race_id}")
        ws_manager.disconnect(websocket)
    except Exception as exc:
        # Unexpected error: ensure we cleanup the connection
        logger.exception(f"WebSocket error for race {race_id}: {exc}")
        try:
            ws_manager.disconnect(websocket)
        except Exception:
            pass
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)