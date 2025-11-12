import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import WebSocket

logger = logging.getLogger("WebSocketManager")


class WebSocketManager:
    """
    Handles WebSocket connections per race room.
    Supports:
      - Connection tracking per race_id
      - Metadata per socket (user_id, role, team_id, allowed_entry_ids)
      - Safe async broadcast and targeted send
    """

    def __init__(self):
        # { race_id: [WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # { str(id(ws)): { user_id, role, team_id, allowed_entry_ids } }
        self._ws_metadata: Dict[str, Dict[str, Any]] = {}
        # Thread-safety
        self._lock = asyncio.Lock()

    # ----------------------------------------------------------------------
    # CONNECTION MANAGEMENT
    # ----------------------------------------------------------------------
    async def connect(self, websocket: WebSocket, race_id: str, metadata: Optional[Dict] = None):
        """
        Accept a new WebSocket connection, add to pool, and register metadata.
        """
        await websocket.accept()
        async with self._lock:
            self.active_connections.setdefault(race_id, []).append(websocket)
            if metadata:
                self._ws_metadata[str(id(websocket))] = metadata

        meta_log = f"{metadata}" if metadata else "no meta"
        logger.info(f"WebSocket connected to race={race_id}, meta={meta_log}")

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket from all rooms and delete metadata.
        """
        removed = False
        for race_id, sockets in list(self.active_connections.items()):
            if websocket in sockets:
                sockets.remove(websocket)
                removed = True
                if not sockets:
                    del self.active_connections[race_id]
        self._ws_metadata.pop(str(id(websocket)), None)
        if removed:
            logger.info(f"WebSocket {id(websocket)} disconnected")
        else:
            logger.debug(f"disconnect() called for unknown WebSocket {id(websocket)}")

    def list_connections(self, race_id: str) -> List[WebSocket]:
        """
        Returns the list of active sockets for a given race_id.
        """
        return self.active_connections.get(race_id, [])

    # ----------------------------------------------------------------------
    # BROADCAST / SEND METHODS
    # ----------------------------------------------------------------------
    async def broadcast(self, race_id: str, message: Any):
        """
        Broadcast a JSON-serializable message to all sockets in the given race room.
        """
        if race_id not in self.active_connections:
            return
        data = json.dumps(message)
        sockets = list(self.active_connections[race_id])

        to_remove = []
        for ws in sockets:
            try:
                await ws.send_text(data)
            except Exception as e:
                logger.warning(f"WS broadcast send failed for {id(ws)}: {e}")
                to_remove.append(ws)

        # Clean up failed sockets
        for ws in to_remove:
            self.disconnect(ws)

    async def send_to(self, race_id: str, websocket: WebSocket, message: Any):
        """
        Send a message to a specific WebSocket in the race room.
        """
        try:
            data = json.dumps(message)
            await websocket.send_text(data)
        except Exception as e:
            logger.warning(f"WS send_to failed for {id(websocket)}: {e}")
            self.disconnect(websocket)

        async def send_to_metadata_match(self, race_id: str, message: Any, predicate):
            """
            Send a JSON-serializable message to all WebSockets in the race
            whose metadata satisfies the predicate(meta) -> bool.

            Example usage:
                await ws_manager.send_to_metadata_match(
                    race_id,
                    {"event": "private_update"},
                    lambda meta: meta and meta.get("team_id") == "TEAM123"
                )
            """
            sockets = self.active_connections.get(race_id, [])
            if not sockets:
                return

            data = json.dumps(message)
            to_remove = []

            for ws in sockets:
                meta = self._ws_metadata.get(str(id(ws)))
                try:
                    if predicate(meta):
                        await ws.send_text(data)
                except Exception as e:
                    logger.warning(f"send_to_metadata_match failed for {id(ws)}: {e}")
                    to_remove.append(ws)

            for ws in to_remove:
                self.disconnect(ws)

    # ----------------------------------------------------------------------
    # METADATA UTILITIES
    # ----------------------------------------------------------------------
    def get_metadata(self, websocket: WebSocket) -> Optional[Dict[str, Any]]:
        return self._ws_metadata.get(str(id(websocket)))

    def get_clients_by_team(self, race_id: str, team_id: str) -> List[WebSocket]:
        """
        Return all sockets in a race whose metadata.team_id matches.
        """
        clients = []
        for ws in self.list_connections(race_id):
            meta = self._ws_metadata.get(str(id(ws)))
            if meta and meta.get("team_id") == team_id:
                clients.append(ws)
        return clients

    def get_clients_by_role(self, race_id: str, role: str) -> List[WebSocket]:
        """
        Return all sockets in a race whose role matches (e.g., 'spectator').
        """
        clients = []
        for ws in self.list_connections(race_id):
            meta = self._ws_metadata.get(str(id(ws)))
            if meta and meta.get("role") == role:
                clients.append(ws)
        return clients

    # ----------------------------------------------------------------------
    # CLEANUP
    # ----------------------------------------------------------------------
    async def close_all_for_race(self, race_id: str):
        """
        Forcefully close all sockets for a given race (e.g., when race ends).
        """
        sockets = self.active_connections.pop(race_id, [])
        for ws in sockets:
            try:
                await ws.close(code=1000)
            except Exception:
                pass
            self._ws_metadata.pop(str(id(ws)), None)
        logger.info(f"Closed all WS connections for race={race_id}")
        
        
ws_manager = WebSocketManager()
