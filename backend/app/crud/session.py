from typing import List
from sqlalchemy.orm import Session
from app.models import session as session_model

def get_active_users_list(db: Session) -> List[dict]:
    """
    Queries the database for active sessions and returns a list of dicts.
    This is a shared utility function.
    """
    active_sessions = db.query(session_model.ActiveSession).all()
    return [
        {
            "user_id": session.user_id,
            "username": session.username,
            "login_time": session.login_time.isoformat(),
        }
        for session in active_sessions
    ]