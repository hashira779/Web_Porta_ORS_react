import secrets
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyUpdate

# --- [UNCHANGED] ---
def get_api_key_by_key(db: Session, key: str) -> Optional[APIKey]:
    """Retrieve an API key from the database by its key string."""
    return db.query(APIKey).filter(APIKey.key == key).first()

# --- [UNCHANGED] ---
def get_api_keys_for_user(db: Session, user_id: int) -> List[APIKey]:
    """Retrieve all API keys created by a specific user."""
    return db.query(APIKey).filter(APIKey.created_by_id == user_id).all()

# --- [MODIFIED] Added the 'name' field ---
def create_api_key(db: Session, *, obj_in: APIKeyCreate, created_by_id: int) -> APIKey:
    """Generate a new secure API key and save it to the database."""
    new_key_string = secrets.token_urlsafe(32)
    db_obj = APIKey(
        name=obj_in.name,
        key=new_key_string,
        scope=obj_in.scope,
        created_by_id=created_by_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- [NEW] Function to update the key's name ---
def update_api_key(db: Session, *, db_obj: APIKey, obj_in: APIKeyUpdate) -> APIKey:
    """Updates the name of an existing API key."""
    if obj_in.name is not None:
        db_obj.name = obj_in.name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- [NEW] Function to activate or deactivate a key ---
def toggle_api_key_status(db: Session, *, db_obj: APIKey) -> APIKey:
    """Toggles the is_active status of an API key."""
    db_obj.is_active = not db_obj.is_active
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- [NEW] Function to permanently delete a key ---
def delete_api_key(db: Session, *, id: str, user_id: int) -> Optional[APIKey]:
    """Permanently deletes an API key from the database."""
    db_obj = db.query(APIKey).filter(APIKey.id == id, APIKey.created_by_id == user_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj

# The old 'revoke_api_key' function is now removed and replaced by the functions above.