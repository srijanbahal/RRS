from fastapi import WebSocket
from typing import Dict, List
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, race_id: str):
        await websocket.accept()
        self.active_connections.setdefault(race_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket):
        for race, sockets in self.active_connections.items():
            if websocket in sockets:
                sockets.remove(websocket)

    async def broadcast(self, race_id: str, message: dict):
        data = json.dumps(message)
        for ws in self.active_connections.get(race_id, []):
            await ws.send_text(data)

ws_manager = WebSocketManager()
