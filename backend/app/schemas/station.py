from pydantic import BaseModel
from typing import Optional

# Base schema for simple related data (to avoid deep nesting)
class Province(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class AMControl(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class Supporter(BaseModel):
    id: int
    supporter_name: str
    email: str

    class Config:
        from_attributes = True

# The main schema for the station_info response
class StationInfo(BaseModel):
    id: int
    station_ID: str
    station_name: Optional[str] = None
    
    # --- Nested Schemas for Related Data ---
    # These fields will be populated with data from the related tables
    province: Optional[Province] = None
    am_control: Optional[AMControl] = None
    supporter: Optional[Supporter] = None

    class Config:
        from_attributes = True # This allows Pydantic to read data from ORM objects