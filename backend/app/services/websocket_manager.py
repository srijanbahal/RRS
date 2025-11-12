# app/services/websocket_manager.py
"""
WebSocketManager
- Manages websocket connections grouped by race_id (rooms).
- Provides robust broadcast/send utilities that tolerate disconnects.
- Keeps a simple heartbeat mechanism (optional) and connection metadata.
"""

from fastapi import WebSocket
from typing import Dict, List, Any, Optional
import asyncio
import json
import logging

logger = logging.getLogger("WebSocketManager")


class WebSocketManager:
    def __init__(self):
        # race_id -> list[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # optional metadata per websocket (weak map not implemented; small product)
        self._ws_metadata: Dict[str, Dict[str, Any]] = {}
        # lock to protect mutations if used in high concurrency
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, race_id: str, metadata: Optional[Dict] = None):
        """
        Accept and register a new websocket connection for a specific race room.
        metadata: optional dict (e.g., {"role": "spectator", "user_id": "..."}).
        """
        await websocket.accept()
        async with self._lock:
            self.active_connections.setdefault(race_id, []).append(websocket)
            if metadata is not None:
                # store minimal metadata keyed by websocket id() - note: not persisted across restarts
                self._ws_metadata[str(id(websocket))] = metadata
        logger.debug(f"WS connected for race={race_id}. total={len(self.active_connections[race_id])}")

    def disconnect(self, websocket: WebSocket):
        """
        Remove websocket from any race room it belongs to and clean metadata.
        """
        removed = False
        sid = str(id(websocket))
        for race, sockets in list(self.active_connections.items()):
            if websocket in sockets:
                try:
                    sockets.remove(websocket)
                except ValueError:
                    pass
                removed = True
                if len(sockets) == 0:
                    # remove empty list
                    self.active_connections.pop(race, None)
                logger.debug(f"WS disconnected for race={race}. remaining={len(sockets)}")
        # cleanup metadata
        if sid in self._ws_metadata:
            self._ws_metadata.pop(sid, None)
        return removed

    async def _safe_send(self, websocket: WebSocket, data: Any):
        """
        Send JSON-compatible data safely to a single websocket.
        Uses send_json if available; otherwise falls back to send_text(json).
        Exceptions are caught and logged — caller should handle removal.
        """
        try:
            # FastAPI WebSocket provides send_json
            await websocket.send_json(data)
        except Exception as e:
            logger.debug(f"send_json failed, trying send_text. error={e}")
            try:
                await websocket.send_text(json.dumps(data))
            except Exception as ex:
                # Final failure — propagate so caller may remove ws
                logger.warning(f"Failed to send to websocket (will be disconnected). error={ex}")
                raise

    async def broadcast(self, race_id: str, message: Dict[str, Any]):
        """
        Broadcast a message (dict) to all active websockets in a race room.
        This method will attempt to send to all sockets and remove dead sockets.
        """
        if race_id not in self.active_connections:
            logger.debug(f"broadcast: no active connections for race {race_id}")
            return

        sockets = list(self.active_connections.get(race_id, []))  # shallow copy
        if not sockets:
            return

        # Prepare send tasks so slow clients don't block others
        send_tasks = []
        for ws in sockets:
            async def _send_and_handle(w):
                try:
                    await self._safe_send(w, message)
                except Exception:
                    # On any failure, remove the websocket from active list
                    logger.debug("Removing dead websocket during broadcast.")
                    self.disconnect(w)

            send_tasks.append(asyncio.create_task(_send_and_handle(ws)))

        # Wait for all sends to complete (fire-and-forget would lose errors)
        if send_tasks:
            await asyncio.gather(*send_tasks, return_exceptions=True)

    async def send_to(self, race_id: str, websocket: WebSocket, message: Dict[str, Any]):
        """
        Send to a specific websocket (if still registered for the race).
        """
        sockets = self.active_connections.get(race_id, [])
        if websocket not in sockets:
            logger.debug("send_to: websocket not in race connections")
            return
        try:
            await self._safe_send(websocket, message)
        except Exception:
            self.disconnect(websocket)

    def list_connections(self, race_id: str) -> List[WebSocket]:
        """
        Return a list of active websockets for a race (copy).
        """
        return list(self.active_connections.get(race_id, []))

    def connection_count(self, race_id: str) -> int:
        return len(self.active_connections.get(race_id, []))

    async def broadcast_batch(self, messages_by_race: Dict[str, List[Dict[str, Any]]]):
        """
        Broadcast multiple messages grouped by race_id (efficient batch).
        messages_by_race: { race_id: [msg1, msg2, ...], ... }
        """
        tasks = []
        for race_id, msgs in messages_by_race.items():
            for m in msgs:
                tasks.append(asyncio.create_task(self.broadcast(race_id, m)))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


# singleton to import across project
ws_manager = WebSocketManager()
