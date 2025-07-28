from pydantic import BaseModel, Field
from typing import List, Optional
from .role import Role

class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    username: str
    email: str

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

# --- CORRECTED SCHEMA ---
class StationSimple(BaseModel):
    id: int
    # This alias tells Pydantic to read from the 'station_name' attribute
    # of the SQLAlchemy model, but output it as 'name' in the JSON.
    name: str = Field(alias='station_name')

    class Config:
        from_attributes = True
        populate_by_name = True # This is required for the alias to work

class User(UserBase):
    id: int
    is_active: bool
    role: Optional[Role] = None
    managed_areas: List[AreaSimple] = []
    owned_stations: List[StationSimple] = [] # This will now work correctly
    class Config:
        from_attributes = True