from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models import user as user_model
from app.schemas import user as user_schema
from app.api.endpoints import get_current_active_user # Import from your existing endpoints file

router = APIRouter()

# --- Admin-only Dependency ---
def get_current_admin_user(current_user: user_model.UserDB = Depends(get_current_active_user)):
    """
    Checks if the current user is an admin.
    NOTE: We are assuming the admin role has an ID of 1.
    """
    if not current_user.role or current_user.role.id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

# --- Admin API Endpoints ---

@router.get("/users", response_model=List[user_schema.User], tags=["Admin"])
def read_all_users(
        db: Session = Depends(get_db),
        admin_user: user_model.UserDB = Depends(get_current_admin_user)
):
    """
    Retrieve all users. Only accessible by an admin.
    """
    users = db.query(user_model.UserDB).all()
    return users

@router.put("/users/{user_id}", response_model=user_schema.User, tags=["Admin"])
def update_user_details(
        user_id: int,
        user_update: user_schema.UserUpdate,
        db: Session = Depends(get_db),
        admin_user: user_model.UserDB = Depends(get_current_admin_user)
):
    """
    Update a user's role and active status. Only for admins.
    """
    db_user = db.query(user_model.UserDB).filter(user_model.UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update attributes from the request
    db_user.role_id = user_update.role_id
    db_user.is_active = user_update.is_active
    db.commit()
    db.refresh(db_user)
    return db_user