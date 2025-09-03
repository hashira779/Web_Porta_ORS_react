import secrets
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyUpdate

def get_api_key_by_key(db: Session, key: str) -> Optional[APIKey]:
    return db.query(APIKey).filter(APIKey.key == key).first()

def get_api_keys_for_user(db: Session, user_id: int) -> List[APIKey]:
    return db.query(APIKey).filter(APIKey.created_by_id == user_id).all()

def create_api_key(db: Session, *, obj_in: APIKeyCreate, created_by_id: int) -> APIKey:
    new_key_string = secrets.token_urlsafe(32)
    db_obj = APIKey(
        name=obj_in.name,
        key=new_key_string,
        scope=obj_in.scope,
        created_by_id=created_by_id,
        user_id=obj_in.user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_api_key(db: Session, *, db_obj: APIKey, obj_in: APIKeyUpdate) -> APIKey:
    if obj_in.name is not None:
        db_obj.name = obj_in.name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def toggle_api_key_status(db: Session, *, db_obj: APIKey) -> APIKey:
    db_obj.is_active = not db_obj.is_active
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_api_key(db: Session, *, id: str, user_id: int) -> Optional[APIKey]:
    db_obj = db.query(APIKey).filter(APIKey.id == id, APIKey.created_by_id == user_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj