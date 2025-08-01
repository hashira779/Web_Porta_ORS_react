import uuid
from typing import List
from datetime import datetime
import pytz  # <-- ADD THIS IMPORT
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.core import security
from app.core.websockets import manager
from app.schemas import user as user_schema
from app.models import user as user_model
from app.models import session as session_model
from app.models.session_history import SessionHistory

router = APIRouter()

# --- Helper function to get the current list of active users ---
def get_active_users_list(db: Session) -> List[dict]:
    """Queries the database for active sessions and returns a list of dicts."""
    active_sessions = db.query(session_model.ActiveSession).all()
    return [
        {
            "user_id": session.user_id,
            "username": session.username,
            "login_time": session.login_time.isoformat(),
        }
        for session in active_sessions
    ]

@router.post("/token", response_model=user_schema.Token, tags=["Authentication"])
async def login_for_access_token(
        request: Request,
        db: Session = Depends(get_db),
        form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Authenticate user and create session records with Cambodia timezone.
    """
    user = security.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    session_id = str(uuid.uuid4())

    # --- UPDATED: Use Cambodia Timezone ---
    cambodia_tz = pytz.timezone('Asia/Phnom_Penh')
    current_cambodia_time = datetime.now(cambodia_tz)

    # Create active session with local time
    new_active_session = session_model.ActiveSession(
        session_id=session_id,
        user_id=user.id,
        username=user.username,
        login_time=current_cambodia_time # <-- USE CAMBODIA TIME
    )
    db.add(new_active_session)

    # Create history record with local time
    new_history_record = SessionHistory(
        user_id=user.id,
        login_time=current_cambodia_time, # <-- USE CAMBODIA TIME
        ip_address=request.client.host,
        user_agent=request.headers.get('user-agent')
    )
    db.add(new_history_record)

    db.commit()

    access_token = security.create_access_token(
        user=user,
        additional_claims={"session_id": session_id, "user_id": user.id}
    )

    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Authentication"])
async def logout(
        db: Session = Depends(get_db),
        token_payload: dict = Depends(security.get_payload_from_token)
):
    """
    Log out the user and update history with Cambodia timezone.
    """
    session_id = token_payload.get("session_id")
    user_id = token_payload.get("user_id")

    if not session_id or not user_id:
        return

    session_to_delete = db.query(session_model.ActiveSession).filter(
        session_model.ActiveSession.session_id == session_id
    ).first()

    if session_to_delete:
        db.delete(session_to_delete)

    history_record_to_update = db.query(SessionHistory).filter(
        SessionHistory.user_id == user_id,
        SessionHistory.logout_time == None
    ).order_by(SessionHistory.login_time.desc()).first()

    if history_record_to_update:
        # --- UPDATED: Use Cambodia Timezone ---
        cambodia_tz = pytz.timezone('Asia/Phnom_Penh')
        history_record_to_update.logout_time = datetime.now(cambodia_tz) # <-- USE CAMBODIA TIME

    db.commit()

    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return

@router.get("/users/me", response_model=user_schema.User, tags=["Users"])
def read_users_me(current_user: user_model.User = Depends(security.get_current_active_user)):
    return current_user

@router.websocket("/ws/active-sessions", name="Active Sessions WebSocket")
async def websocket_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())
    await manager.connect(client_id, websocket)
    db: Session = SessionLocal()
    try:
        initial_users = get_active_users_list(db)
        await websocket.send_json({"type": "initial_state", "data": initial_users})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    finally:
        db.close()
