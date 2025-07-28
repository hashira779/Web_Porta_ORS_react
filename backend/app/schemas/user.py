from pydantic import BaseModel
from typing import List, Optional
from .role import Role

class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    username: str
    email: str # We keep email for creation and response, but not in the DB model

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class AreaSimple(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class StationSimple(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    role: Optional[Role] = None
    managed_areas: List[AreaSimple] = []
    owned_stations: List[StationSimple] = []
    class Config: from_attributes = True