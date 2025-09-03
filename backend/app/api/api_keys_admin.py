from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import api_key as api_key_schema
from app.crud import crud_api_key
from app.models import user as user_model, api_key as api_key_model
from app.core.security import get_current_active_user

router = APIRouter()

def get_current_admin_user(current_user: user_model.User = Depends(get_current_active_user)):
    if not current_user.role or current_user.role.name.lower() != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The user does not have enough privileges")
    return current_user

@router.post("/admin/api-keys", response_model=api_key_schema.APIKey, status_code=status.HTTP_201_CREATED, summary="Create a new API Key", tags=["Admin: API Keys"])
def create_new_api_key(*, db: Session = Depends(get_db), key_in: api_key_schema.APIKeyCreate, admin_user: user_model.User = Depends(get_current_admin_user)):
    return crud_api_key.create_api_key(db=db, obj_in=key_in, created_by_id=admin_user.id)

@router.get("/admin/api-keys", response_model=List[api_key_schema.APIKey], summary="List API Keys created by the admin", tags=["Admin: API Keys"])
def list_my_api_keys(*, db: Session = Depends(get_db), admin_user: user_model.User = Depends(get_current_admin_user)):
    return crud_api_key.get_api_keys_for_user(db=db, user_id=admin_user.id)

@router.patch("/admin/api-keys/{key_id}/toggle-status", response_model=api_key_schema.APIKey, summary="Activate or Deactivate an API Key", tags=["Admin: API Keys"])
def toggle_key_status(*, key_id: str, db: Session = Depends(get_db), admin_user: user_model.User = Depends(get_current_admin_user)):
    db_key = db.query(api_key_model.APIKey).filter_by(id=key_id, created_by_id=admin_user.id).first()
    if not db_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found")
    return crud_api_key.toggle_api_key_status(db=db, db_obj=db_key)

@router.put("/admin/api-keys/{key_id}", response_model=api_key_schema.APIKey, summary="Update an API Key's Name", tags=["Admin: API Keys"])
def update_key_name(*, key_id: str, key_in: api_key_schema.APIKeyUpdate, db: Session = Depends(get_db), admin_user: user_model.User = Depends(get_current_admin_user)):
    db_key = db.query(api_key_model.APIKey).filter_by(id=key_id, created_by_id=admin_user.id).first()
    if not db_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found")
    return crud_api_key.update_api_key(db=db, db_obj=db_key, obj_in=key_in)

@router.delete("/admin/api-keys/{key_id}", summary="Permanently Delete an API Key", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin: API Keys"])
def permanently_delete_key(*, key_id: str, db: Session = Depends(get_db), admin_user: user_model.User = Depends(get_current_admin_user)):
    crud_api_key.delete_api_key(db=db, id=key_id, user_id=admin_user.id)
    return None
@router.get(
    "/admin/users-list",
    response_model=List[api_key_schema.UserNested], # Reuse the nested user schema
    summary="Get a list of all users",
    tags=["Admin: API Keys"]
)
def list_all_users(
        db: Session = Depends(get_db),
        admin_user: user_model.User = Depends(get_current_admin_user)
):
    """
    Retrieve a simplified list of all users to populate UI dropdowns.
    """
    return db.query(user_model.User).all()