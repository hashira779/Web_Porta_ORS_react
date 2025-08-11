import uuid
from typing import List
from datetime import datetime
import pytz
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core import security
from app.core.websockets import manager
from app.schemas import user as user_schema
from app.models import user as user_model, session as session_model
from app.models.session_history import SessionHistory

# --- UPDATED: Import from the new crud and security modules ---
from app.crud.session import get_active_users_list
from app.core.security import get_current_user_from_websocket, get_current_active_user

router = APIRouter()

# --- The get_active_users_list function has been REMOVED from this file ---

@router.post("/token", response_model=user_schema.Token, tags=["Authentication"])
async def login_for_access_token(
        request: Request,
        db: Session = Depends(get_db),
        form_data: OAuth2PasswordRequestForm = Depends()
):
    user = security.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    session_id = str(uuid.uuid4())
    cambodia_tz = pytz.timezone('Asia/Phnom_Penh')
    current_cambodia_time = datetime.now(cambodia_tz)

    new_active_session = session_model.ActiveSession(
        session_id=session_id, user_id=user.id, username=user.username, login_time=current_cambodia_time
    )
    db.add(new_active_session)

    new_history_record = SessionHistory(
        user_id=user.id, login_time=current_cambodia_time, ip_address=request.client.host,
        user_agent=request.headers.get('user-agent')
    )
    db.add(new_history_record)
    db.commit()

    access_token = security.create_access_token(user=user, additional_claims={"session_id": session_id})

    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Authentication"])
async def logout(
        db: Session = Depends(get_db),
        token_payload: dict = Depends(security.get_payload_from_token)
):
    """
    Logs out the user from ALL sessions and records the logout time for all of them.
    """
    user_id = token_payload.get("user_id")
    if not user_id:
        return # Cannot proceed without a user_id from the token

    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        return # User not found

    # --- THIS LOGIC IS COPIED FROM YOUR 'terminate-sessions' ENDPOINT ---

    # 1. Invalidate all future tokens by incrementing the version
    user.token_version += 1

    # 2. Remove ALL active sessions for this user from the active sessions table
    db.query(session_model.ActiveSession).filter(
        session_model.ActiveSession.user_id == user_id
    ).delete(synchronize_session=False)

    # 3. Find ALL open session history records for the user and update them with a logout time
    cambodia_tz = pytz.timezone('Asia/Phnom_Penh')
    db.query(SessionHistory).filter(
        SessionHistory.user_id == user_id,
        SessionHistory.logout_time.is_(None)
    ).update({"logout_time": datetime.now(cambodia_tz)})

    # --- END OF COPIED LOGIC ---

    db.commit()

    # Broadcast the change to any listening admins
    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return

@router.get("/users/me", response_model=user_schema.User, tags=["Users"])
def read_users_me(current_user: user_model.User = Depends(get_current_active_user)):
    return current_user

@router.websocket("/ws/active-sessions", name="Active Sessions WebSocket")
async def websocket_active_sessions(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect_admin_listener(websocket)
    try:
        active_users = get_active_users_list(db)
        await manager.broadcast_active_users(active_users)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_admin_listener(websocket)

@router.websocket("/ws/notifications", name="User Notifications WebSocket")
async def websocket_notifications(
        websocket: WebSocket,
        user: user_model.User = Depends(get_current_user_from_websocket)
):
    if not user:
        return
    await manager.connect_user(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(user.id, websocket)