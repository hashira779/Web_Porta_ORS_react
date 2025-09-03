from fastapi import Depends, HTTPException, Security, status, Request
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models import api_key as api_key_model, user as user_model
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def require_api_key_with_scope(required_scope: str):
    def get_key(
            request: Request,
            api_key: str = Security(api_key_header),
            db: Session = Depends(get_db)
    ):
        if not api_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API Key required")

        # --- [DEBUGGING CODE] ---
        print("--- DEBUG: API Key Received in Header ---")
        print(f"'{api_key}'")
        # --- [END DEBUGGING CODE] ---

        db_key = db.query(api_key_model.APIKey).options(
            joinedload(api_key_model.APIKey.owner).joinedload(user_model.User.role)
        ).filter(api_key_model.APIKey.key == api_key).first()

        # --- [DEBUGGING CODE] ---
        print("--- DEBUG: Result from Database ---")
        if db_key:
            print(f"Found Key ID: {db_key.id}")
            print(f"Is Active: {db_key.is_active}")
            print(f"Scope: '{db_key.scope}'")
        else:
            print("No matching key was found in the database.")
        print("------------------------------------")
        # --- [END DEBUGGING CODE] ---

        if not db_key or not db_key.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API Key")

        if db_key.scope != required_scope:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"The provided key does not have the required '{required_scope}' scope.")

        request.state.api_key_owner = db_key.owner

        return db_key
    return get_key