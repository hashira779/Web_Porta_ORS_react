from pydantic import BaseModel, Field
from typing import List, Optional

# Forward declaration to handle circular dependencies
class UserSimple(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

# --- Base Schemas ---
class StationBase(BaseModel):
    # Use Field alias to map station_name from the model to 'name' in the JSON response
    name: str = Field(..., alias='station_name')

class AreaBase(BaseModel):
    name: str

# --- Schemas for Creating Data ---
class StationCreate(StationBase):
    pass

class AreaCreate(AreaBase):
    pass

# --- NEW: Schema for Updating Area ---
class AreaUpdate(AreaBase):
    pass
# --- END NEW ---

# --- Schemas for Reading Data ---
class Station(StationBase):
    id: int
    owners: List[UserSimple] = []
    class Config:
        from_attributes = True
        populate_by_name = True # Important for allowing the alias to work

class Area(AreaBase):
    id: int
    stations: List[Station] = []
    managers: List[UserSimple] = []
    class Config:
        from_attributes = True

# --- Schemas for Assigning ---
class StationAssignment(BaseModel):
    station_ids: List[int]

class ManagerAssignment(BaseModel):
    manager_ids: List[int]

# --- NEW: Schema for assigning owners ---
class OwnerAssignment(BaseModel):
    owner_ids: List[int]