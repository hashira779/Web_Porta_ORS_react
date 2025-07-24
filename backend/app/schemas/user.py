from pydantic import BaseModel, EmailStr
from typing import Optional

# This is a Pydantic model for data validation, not a SQLAlchemy model.

# --- Base Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Schemas for Creating/Reading Users ---
class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role_id: int

    class Config:
        orm_mode = True # Use 'from_attributes = True' for Pydantic v2

# --- Schema for Updating Users (ADD THIS) ---
class UserUpdate(BaseModel):
    role_id: int
    is_active: bool