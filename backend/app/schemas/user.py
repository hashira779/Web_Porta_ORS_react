from pydantic import BaseModel, EmailStr
from typing import Optional
from .role import Role  # Import the Role schema

class UserBase(BaseModel):
    username: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    role_id: int
    is_active: bool

class User(UserBase):
    id: int
    is_active: bool
    role: Optional[Role] = None

    class Config:
        from_attributes = True