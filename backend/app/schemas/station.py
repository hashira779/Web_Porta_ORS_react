from pydantic import BaseModel, Field
from typing import List, Optional

# A simplified schema for User, used for nested data in responses
# This prevents sending sensitive user info like hashed passwords.
class UserSimple(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


# --- Base Schemas (Common fields for creating/updating) ---

class StationBase(BaseModel):
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    Province: Optional[str] = None
    AM_Control: Optional[str] = None
    Operating: Optional[int] = None
    am_control_id: Optional[int] = None
    supporter_id: Optional[int] = None
    province_id: Optional[str] = None
    FleetCardStatus: Optional[int] = None
    POSUsing: Optional[int] = None
    active: Optional[int] = 1
    area_id: Optional[int] = None

class AreaBase(BaseModel):
    name: str


# --- Schemas for Reading/Response Data ---

class Station(StationBase):
    id: int
    owners: List[UserSimple] = []

    class Config:
        from_attributes = True

class Area(AreaBase):
    id: int
    stations: List[Station] = []
    managers: List[UserSimple] = []

    class Config:
        from_attributes = True


# --- Schemas for Creating Data ---

class StationCreate(StationBase):
    station_id: str
    station_name: str

class AreaCreate(AreaBase):
    pass


# --- Schemas for Updating Data ---

class StationUpdate(StationBase):
    pass # All fields are optional for updates

class AreaUpdate(AreaBase):
    pass


# --- Schemas for Assignments & Other Operations ---

class StationAssignment(BaseModel):
    station_ids: List[int]

class ManagerAssignment(BaseModel):
    manager_ids: List[int]

class OwnerAssignment(BaseModel):
    owner_ids: List[int]


class StationSuggestion(BaseModel):
    station_id: str
    station_name: str

    class Config:
        from_attributes = True