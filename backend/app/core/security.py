from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import user as user_model

# Reminder: Make sure you've added the 'token_version' column to your User model
# and applied the database migration.

SECRET_KEY = "your-very-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- UPDATED: create_access_token ---
# It now accepts additional claims like session_id.
def create_access_token(
        user: user_model.User,
        expires_delta: Optional[timedelta] = None,
        additional_claims: Optional[Dict[str, any]] = None
):
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode = {
        "sub": user.username,
        "exp": expire,
        "token_version": user.token_version
    }

    # Add any extra data to the token, like the session_id
    if additional_claims:
        to_encode.update(additional_claims)

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- UPDATED: decode_access_token ---
# It now returns the entire payload.
def decode_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None or payload.get("token_version") is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def authenticate_user(db: Session, username: str, password: str) -> Optional[user_model.User]:
    user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

# --- NEW: get_payload_from_token ---
# This is the missing function your logout endpoint needs.
def get_payload_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token, credentials_exception)
    return payload

# --- UPDATED: get_current_user ---
# This now uses the new get_payload_from_token function.
def get_current_user(
        db: Session = Depends(get_db),
        payload: dict = Depends(get_payload_from_token)
) -> user_model.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    username: str = payload.get("sub")
    token_version: int = payload.get("token_version")

    user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if user is None:
        raise credentials_exception

    if user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been invalidated. Please log in again."
        )

    return user

def get_current_active_user(current_user: user_model.User = Depends(get_current_user)) -> user_model.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user