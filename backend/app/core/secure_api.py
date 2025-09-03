from fastapi import Depends, HTTPException, Security, status, Request
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models import api_key as api_key_model, user as user_model
from app.schemas.api_key import APIScope # Import the Enum
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# This is the "guard" function
def require_api_key_with_scope(required_scope: APIScope):
    def get_key(
            request: Request,
            api_key: str = Security(api_key_header),
            db: Session = Depends(get_db)
    ):
        if not api_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API Key required")

        # Find the key and its owner in the database
        db_key = db.query(api_key_model.APIKey).options(
            joinedload(api_key_model.APIKey.owner).joinedload(user_model.User.role)
        ).filter(api_key_model.APIKey.key == api_key).first()

        # Check if key is valid and active
        if not db_key or not db_key.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API Key")

        # --- THIS IS THE LOGIC ---
        # Check if the key's scope matches the required scope for the endpoint
        if db_key.scope != required_scope:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. This key requires the '{required_scope.value}' scope."
            )

        # Attach the key's owner to the request for the endpoint to use
        request.state.api_key_owner = db_key.owner

        return db_key
    return get_key