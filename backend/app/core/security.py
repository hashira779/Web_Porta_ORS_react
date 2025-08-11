from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from jose import JWTError, jwt
from pydantic import ValidationError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, WebSocket, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import user as user_model
from app.schemas import token as token_schema

# --- Constants ---
# IMPORTANT: In a production environment, load this from environment variables.
SECRET_KEY = "your-very-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# --- Instances ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Hashing ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- Token Logic ---
def create_access_token(
        user: user_model.User,
        expires_delta: Optional[timedelta] = None,
        additional_claims: Optional[Dict[str, any]] = None
) -> str:
    """Creates a new JWT access token."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    # --- UPDATED: 'user_id' is now part of the main payload ---
    # This ensures it's always present for functions like logout.
    to_encode = {
        "sub": user.username,
        "exp": expire,
        "user_id": user.id, # <-- THIS LINE IS THE FIX
        "token_version": user.token_version,
    }

    if additional_claims:
        to_encode.update(additional_claims)

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str, credentials_exception) -> dict:
    """Decodes a JWT token and returns its payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None or payload.get("token_version") is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

# --- Core Authentication Logic ---
def authenticate_user(db: Session, username: str, password: str) -> Optional[user_model.User]:
    """Authenticates a user against the database."""
    user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

# --- Standard HTTP Dependencies ---
def get_payload_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to get a token's payload."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return decode_access_token(token, credentials_exception)

def get_current_user(
        db: Session = Depends(get_db),
        payload: dict = Depends(get_payload_from_token)
) -> user_model.User:
    """Dependency to get the current user object from the database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    username: str = payload.get("sub")
    token_version: int = payload.get("token_version")

    user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if user is None or user.token_version != token_version:
        raise credentials_exception

    return user

def get_current_active_user(current_user: user_model.User = Depends(get_current_user)) -> user_model.User:
    """Dependency to get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# --- WebSocket Dependency ---
async def get_current_user_from_websocket(
        websocket: WebSocket,
        token: str = Query(None), # Use Query(None) to handle missing token
        db: Session = Depends(get_db)
) -> Optional[user_model.User]:
    """
    Dependency to authenticate a user from a WebSocket token.
    This version gracefully handles all errors and closes with a valid WS code.
    """
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        # We don't need to pass a credentials_exception here anymore
        payload = decode_access_token(token, credentials_exception=None)
        if payload is None: # decode_access_token might return None on JWTError
            raise ValidationError("Invalid Token Payload", model=token_schema.TokenPayload)

        token_data = token_schema.TokenPayload(**payload)

        # Explicitly check for user_id in the token payload
        if token_data.user_id is None:
            raise ValidationError("user_id missing from token", model=token_schema.TokenPayload)

    except (JWTError, ValidationError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    user = db.query(user_model.User).filter(user_model.User.id == token_data.user_id).first()

    # Check for user existence, activity, and token version all at once
    if user is None or not user.is_active or user.token_version != token_data.token_version:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    return user