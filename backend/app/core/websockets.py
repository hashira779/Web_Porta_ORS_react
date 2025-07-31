from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def broadcast_active_users(self, active_users: List[dict]):
        message = {
            "type": "active_users_update",
            "data": active_users
        }
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()