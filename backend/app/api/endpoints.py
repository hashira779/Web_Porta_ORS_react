import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.session import get_db
from app.core import security
from app.core.websockets import manager
from app.schemas import user as user_schema
from app.models import user as user_model
from app.models import session as session_model

router = APIRouter()

# --- Helper function to get the current list of active users ---
def get_active_users_list(db: Session) -> List[dict]:
    """Queries the database for active sessions and returns a list of dicts."""
    active_sessions = db.query(session_model.ActiveSession).all()
    # This format should match your ActiveUser interface on the frontend
    return [
        {
            "user_id": session.user_id,
            "username": session.username,
            "login_time": session.login_time.isoformat(),
        }
        for session in active_sessions
    ]

@router.post("/token", response_model=user_schema.Token, tags=["Authentication"])
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and create a session.
    """
    user = security.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 1. Create a unique session ID
    session_id = str(uuid.uuid4())

    # 2. Store the new session in the database
    new_session = session_model.ActiveSession(
        session_id=session_id, user_id=user.id, username=user.username
    )
    db.add(new_session)
    db.commit()

    # 3. Create an access token that includes the session_id
    access_token = security.create_access_token(
        user=user,
        # We pass the session_id to be embedded in the JWT
        additional_claims={"session_id": session_id}
    )

    # 4. Broadcast the updated list of active users to connected admins
    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Authentication"])
async def logout(
        db: Session = Depends(get_db),
        # This dependency gets the user and session_id from the token
        token_payload: dict = Depends(security.get_payload_from_token)
):
    """
    Log out the user by deleting their active session.
    """
    session_id = token_payload.get("session_id")
    if not session_id:
        return # Or raise an exception if a session_id is always expected

    # 1. Find the session in the database and delete it
    session_to_delete = db.query(session_model.ActiveSession).filter(
        session_model.ActiveSession.session_id == session_id
    ).first()

    if session_to_delete:
        db.delete(session_to_delete)
        db.commit()

        # 2. Broadcast the updated list of active users to connected admins
        active_users = get_active_users_list(db)
        await manager.broadcast_active_users(active_users)

    return

@router.get("/users/me", response_model=user_schema.User, tags=["Users"])
def read_users_me(current_user: user_model.User = Depends(security.get_current_active_user)):
    """
    Get the profile of the current authenticated user.
    """
    return current_user

@router.websocket("/ws/active-sessions", name="Active Sessions WebSocket")
async def websocket_endpoint(websocket: WebSocket):
    # This should be protected to only allow admin users
    client_id = str(uuid.uuid4())
    await manager.connect(client_id, websocket)

    db: Session = SessionLocal()

    try:
        # Send the initial list of users
        initial_users = get_active_users_list(db)
        await websocket.send_json({"type": "initial_state", "data": initial_users})

        # Keep the connection open
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(client_id)

    finally:
        db.close()