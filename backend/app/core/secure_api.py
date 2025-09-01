# In: app/core/secure_api.py

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import crud_api_key

# Define the header we expect the key to be in. auto_error=False means we handle the error message ourselves.
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def require_api_key_with_scope(required_scope: str):
    """
    This is a dependency factory. It creates a dependency that will:
    1. Look for the X-API-Key header.
    2. Check the database for a key that matches.
    3. Verify the key is active AND has the required scope.
    """
    def get_key(
            api_key: str = Security(api_key_header),
            db: Session = Depends(get_db)
    ):
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API Key required"
            )

        # Check if the key exists in the database
        db_key = crud_api_key.get_api_key_by_key(db, key=api_key)

        # Raise an error if the key is not found or is marked as inactive
        if not db_key or not db_key.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API Key"
            )

        # Raise an error if the key does not have the correct scope for this endpoint
        if db_key.scope != required_scope:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API Key does not have permission for this resource"
            )

        return db_key

    return get_key