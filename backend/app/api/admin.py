from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models import user as user_model, role as role_model
from app.schemas import user as user_schema, role as role_schema
from app.core import security
from app.api.endpoints import get_current_active_user

router = APIRouter()

# --- Admin-only Dependency ---
def get_current_admin_user(current_user: user_model.UserDB = Depends(get_current_active_user)):
    if not current_user.role or current_user.role.name.lower() != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin")
    return current_user

# === USER MANAGEMENT ===
@router.post("/users", response_model=user_schema.User, status_code=status.HTTP_201_CREATED, tags=["Admin - Users"])
def create_user(user: user_schema.UserCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    db_user = db.query(user_model.UserDB).filter(user_model.UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = security.get_password_hash(user.password)
    new_user = user_model.UserDB(**user.dict(exclude={'password'}), hashed_password=hashed_password, is_active=True)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users", response_model=List[user_schema.User], tags=["Admin - Users"])
def read_users(db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    return db.query(user_model.UserDB).all()

@router.put("/users/{user_id}", response_model=user_schema.User, tags=["Admin - Users"])
def update_user(user_id: int, user_update: user_schema.UserUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    db_user = db.query(user_model.UserDB).filter(user_model.UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Users"])
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    db_user = db.query(user_model.UserDB).filter(user_model.UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return

# === ROLE & PERMISSION MANAGEMENT ===
@router.post("/roles", response_model=role_schema.Role, status_code=status.HTTP_201_CREATED, tags=["Admin - Roles"])
def create_role(role: role_schema.RoleCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    permissions = db.query(role_model.Permission).filter(role_model.Permission.id.in_(role.permission_ids)).all()
    new_role = role_model.Role(name=role.name, description=role.description, permissions=permissions)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

# **CORRECTED: REMOVED DUPLICATE FUNCTION**
@router.get("/roles", response_model=List[role_schema.Role], tags=["Admin - Roles"])
def get_all_roles(db: Session = Depends(get_db), admin_user: user_model.UserDB = Depends(get_current_admin_user)):
    return db.query(role_model.Role).all()

@router.put("/roles/{role_id}", response_model=role_schema.Role, tags=["Admin - Roles"])
def update_role(role_id: int, role_update: role_schema.RoleUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    db_role = db.query(role_model.Role).filter(role_model.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    db_role.name = role_update.name
    db_role.description = role_update.description
    permissions = db.query(role_model.Permission).filter(role_model.Permission.id.in_(role_update.permission_ids)).all()
    db_role.permissions = permissions
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Roles"])
def delete_role(role_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    db_role = db.query(role_model.Role).filter(role_model.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(db_role)
    db.commit()
    return

@router.post("/permissions", response_model=role_schema.Permission, status_code=status.HTTP_201_CREATED, tags=["Admin - Roles"])
def create_permission(permission: role_schema.PermissionCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    new_permission = role_model.Permission(**permission.dict())
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

@router.get("/permissions", response_model=List[role_schema.Permission], tags=["Admin - Roles"])
def get_all_permissions(db: Session = Depends(get_db), admin_user: user_model.UserDB = Depends(get_current_admin_user)):
    return db.query(role_model.Permission).all()