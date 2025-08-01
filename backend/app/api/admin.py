from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db.session import get_db
from app.models import user as user_model, role as role_model, station as station_model, session_history as session_history_model
from app.schemas import user as user_schema, role as role_schema, station as station_schema, session_history as history_schema
from app.core.security import get_current_active_user, get_password_hash
from app.models import session as session_model
from app.schemas import session as session_schema
from sqlalchemy import func
from app.core.websockets import manager
from app.api.endpoints import get_active_users_list
router = APIRouter()

def get_current_admin_user(current_user: user_model.User = Depends(get_current_active_user)):
    if not current_user.role or current_user.role.name.lower() != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin")
    return current_user

@router.get("/users", response_model=List[user_schema.User], tags=["Admin - Users"])
def get_all_users(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(user_model.User).options(joinedload(user_model.User.role)).all()

@router.post("/users", response_model=user_schema.User, tags=["Admin - Users"])
def create_user(user: user_schema.UserCreate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_user_by_username = db.query(user_model.User).filter(user_model.User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user_by_email = db.query(user_model.User).filter(user_model.User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    # CORRECTED: Added the 'email' field to the model constructor
    new_user = user_model.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=user_schema.User, tags=["Admin - Users"])
def update_user(user_id: int, user_update: user_schema.UserUpdate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_user = db.query(user_model.User).get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Users"])
def delete_user(user_id: int, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_user = db.query(user_model.User).get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return

@router.get("/roles", response_model=List[role_schema.Role], tags=["Admin - Roles"])
def get_all_roles(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(role_model.Role).options(joinedload(role_model.Role.permissions)).all()

@router.post("/roles", response_model=role_schema.Role, tags=["Admin - Roles"])
def create_role(role: role_schema.RoleBase, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    new_role = role_model.Role(**role.model_dump())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.put("/roles/{role_id}", response_model=role_schema.Role, tags=["Admin - Roles"])
def update_role(role_id: int, role_update: role_schema.RoleDetailsUpdate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_role = db.query(role_model.Role).get(role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db_role.name = role_update.name
    db_role.description = role_update.description
    db.commit()
    db.refresh(db_role)
    return db_role

@router.post("/roles/{role_id}/permissions", response_model=role_schema.Role, tags=["Admin - Roles"])
def update_role_permissions(role_id: int, permissions_update: role_schema.RoleUpdate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    role = db.query(role_model.Role).get(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    permissions = db.query(role_model.Permission).filter(role_model.Permission.id.in_(permissions_update.permission_ids)).all()
    role.permissions = permissions
    db.commit()
    db.refresh(role)
    return role



@router.get("/permissions", response_model=List[role_schema.Permission], tags=["Admin - Roles"])
def get_all_permissions(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(role_model.Permission).all()
# --- NEW: Create Permission Endpoint ---
@router.post("/permissions", response_model=role_schema.Permission, status_code=status.HTTP_201_CREATED, tags=["Admin"])
def create_permission(permission: role_schema.PermissionCreate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    new_permission = role_model.Permission(**permission.model_dump())
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

@router.put("/permissions/{permission_id}", response_model=role_schema.Permission, tags=["Admin"])
def update_permission(permission_id: int, permission_update: role_schema.PermissionCreate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_permission = db.query(role_model.Permission).get(permission_id)
    if not db_permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    db_permission.name = permission_update.name
    db_permission.description = permission_update.description
    db.commit()
    db.refresh(db_permission)
    return db_permission

@router.delete("/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"])
def delete_permission(permission_id: int, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_permission = db.query(role_model.Permission).get(permission_id)
    if db_permission:
        db.delete(db_permission)
        db.commit()
    return



@router.get("/areas/details", response_model=List[station_schema.Area], tags=["Admin - Assignments"])
def get_area_details(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(station_model.Area).options(joinedload(station_model.Area.stations), joinedload(station_model.Area.managers)).all()

# CORRECTED: This now loads the 'owners' relationship for each station
@router.get("/stations", response_model=List[station_schema.Station], tags=["Admin - Assignments"])
def get_all_stations(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(station_model.Station).options(joinedload(station_model.Station.owners)).all()

@router.post("/areas", response_model=station_schema.Area, tags=["Admin - Assignments"])
def create_area(area: station_schema.AreaBase, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_area = station_model.Area(**area.model_dump())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

# --- NEW: Update Area Endpoint ---
@router.put("/areas/{area_id}", response_model=station_schema.Area, tags=["Admin - Assignments"])
def update_area(area_id: int, area_update: station_schema.AreaUpdate, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_area = db.query(station_model.Area).get(area_id)
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    db_area.name = area_update.name
    db.commit()
    db.refresh(db_area)
    return db_area

# --- NEW: Delete Area Endpoint ---
@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Assignments"])
def delete_area(area_id: int, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    db_area = db.query(station_model.Area).get(area_id)
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    db.delete(db_area)
    db.commit()
    return

@router.put("/assignments/areas/{area_id}/managers", response_model=station_schema.Area, tags=["Admin - Assignments"])
def assign_managers_to_area(area_id: int, payload: station_schema.ManagerAssignment, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    area = db.query(station_model.Area).options(joinedload(station_model.Area.managers)).get(area_id)
    if not area: raise HTTPException(status_code=404, detail="Area not found")
    managers = db.query(user_model.User).filter(user_model.User.id.in_(payload.manager_ids)).all()
    area.managers = managers
    db.commit()
    db.refresh(area)
    return area

@router.put("/assignments/areas/{area_id}/stations", response_model=station_schema.Area, tags=["Admin - Assignments"])
def assign_stations_to_area(area_id: int, payload: station_schema.StationAssignment, db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    area = db.query(station_model.Area).get(area_id)
    if not area: raise HTTPException(status_code=404, detail="Area not found")

    # Unassign all stations currently in this area
    db.query(station_model.Station).filter(station_model.Station.area_id == area_id).update({"area_id": None})

    # Assign new stations to this area
    db.query(station_model.Station).filter(station_model.Station.id.in_(payload.station_ids)).update({"area_id": area_id}, synchronize_session=False)

    db.commit()
    db.refresh(area)
    return area
@router.get("/areas/details", response_model=List[station_schema.Area], tags=["Admin - Assignments"])
def get_area_details(db: Session = Depends(get_db), admin: user_model.User = Depends(get_current_admin_user)):
    return db.query(station_model.Area).options(
        joinedload(station_model.Area.stations),
        joinedload(station_model.Area.managers)
    ).all()

# --- NEW: Endpoint to assign stations to a specific owner ---
@router.put("/assignments/users/{user_id}/stations", response_model=user_schema.User, tags=["Admin - Assignments"])
def assign_stations_to_owner(
        user_id: int,
        payload: station_schema.StationAssignment,
        db: Session = Depends(get_db),
        admin: user_model.User = Depends(get_current_admin_user)
):
    """Assigns a list of stations to a specific user (owner)."""
    user = db.query(user_model.User).options(joinedload(user_model.User.owned_stations)).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.role or user.role.name.lower() != 'owner':
        raise HTTPException(status_code=400, detail="User is not an owner")

    stations = db.query(station_model.Station).filter(station_model.Station.id.in_(payload.station_ids)).all()
    user.owned_stations = stations

    db.commit()
    db.refresh(user)
    return user

# function scan user
@router.get("/sessions/active", response_model=List[session_schema.ActiveSession], tags=["Admin Sessions"])
def get_active_sessions(db: Session = Depends(get_db)):
    """
    Get a list of all currently active user sessions from the database.
    """
    sessions = db.query(session_model.ActiveSession).order_by(
        session_model.ActiveSession.login_time.desc()
    ).all()
    return sessions

@router.post("/terminate-sessions/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin Sessions"])
async def terminate_user_sessions(user_id: int, db: Session = Depends(get_db)):
    """
    Terminates all sessions for a user.
    """
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # This logic is for JWT token versioning to invalidate old tokens
    user.token_version += 1

    # This removes the user from the real-time active sessions table
    db.query(session_model.ActiveSession).filter(
        session_model.ActiveSession.user_id == user_id
    ).delete(synchronize_session=False)

    db.commit()

    # Broadcast the updated list of active users to all connected clients
    active_users = get_active_users_list(db)
    await manager.broadcast_active_users(active_users)

    return

# ===============================================
#  NEW History Endpoints
# ===============================================

@router.get(
    "/sessions/history-summary",
    response_model=List[history_schema.UserHistorySummary],
    tags=["Admin Sessions"]
)
def get_users_with_history(db: Session = Depends(get_db)):
    """
    Get a summary of all users and their total login counts from the history table.
    """
    results = (
        db.query(
            user_model.User.id.label("user_id"),
            user_model.User.username.label("username"),
            func.count(session_history_model.SessionHistory.id).label("session_count"),
        )
        .join(session_history_model.SessionHistory, user_model.User.id == session_history_model.SessionHistory.user_id)
        .group_by(user_model.User.id, user_model.User.username)
        .order_by(user_model.User.username)
        .all()
    )
    return results


@router.get(
    "/sessions/history/{user_id}",
    response_model=history_schema.UserHistoryResponse,
    tags=["Admin Sessions"]
)
def get_history_for_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get the detailed login history for a single user.
    """
    user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    history = (
        db.query(session_history_model.SessionHistory)
        .filter(session_history_model.SessionHistory.user_id == user_id)
        .order_by(session_history_model.SessionHistory.login_time.desc())
        .all()
    )

    return {"username": user.username, "history": history}