from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Set

class ConnectionManager:
    def __init__(self):
        # Maps a user_id to a set of their active WebSocket connections
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # A set of connections for the admin session monitoring page
        self.admin_session_listeners: Set[WebSocket] = set()

    # --- Methods for General User Notifications ---
    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        print(f"✅ WebSocket connected for user_id: {user_id}. Total connections for user: {len(self.user_connections[user_id])}")

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                print(f"❌ WebSocket disconnected for user_id: {user_id}. User removed from active connections.")
            else:
                print(f"❌ WebSocket disconnected for user_id: {user_id}. Remaining connections for user: {len(self.user_connections[user_id])}")

    async def send_personal_message(self, user_id: int, message: dict):
        print(f"-> Attempting to send personal message to user_id: {user_id}")
        if user_id in self.user_connections:
            connections = self.user_connections[user_id]
            print(f"  Found {len(connections)} active connection(s) for user_id: {user_id}.")
            for websocket in list(connections):
                await websocket.send_json(message)
                print(f"  ✅ Message sent to user_id: {user_id}")
        else:
            print(f"  ❌ No active WebSocket connection found for user_id: {user_id}.")

    # --- Methods for Admin Session Management Page ---
    async def connect_admin_listener(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_session_listeners.add(websocket)
        print("✅ Admin listener connected to active sessions.")

    def disconnect_admin_listener(self, websocket: WebSocket):
        self.admin_session_listeners.discard(websocket)
        print("❌ Admin listener disconnected from active sessions.")

    async def broadcast_active_users(self, active_users: List[dict]):
        message = {"type": "active_users_update", "data": active_users}
        for websocket in list(self.admin_session_listeners):
            await websocket.send_json(message)

manager = ConnectionManager()