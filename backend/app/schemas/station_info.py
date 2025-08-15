from pydantic import BaseModel
from typing import Optional

# NEW: Simple schemas to represent the nested objects in the API response
class AMControlSimple(BaseModel):
    name: str
    class Config:
        from_attributes = True

class SupporterSimple(BaseModel):
    supporter_name: str
    class Config:
        from_attributes = True

class ProvinceSimple(BaseModel):  # <-- ADD THIS SCHEMA
    name: str
    class Config: from_attributes = True

# --- Base Schemas ---
# All fields from the database model are here.
class StationInfoBase(BaseModel):
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    AM_Control: Optional[str] = None
    Operating: Optional[int] = None
    am_control_id: Optional[int] = None
    supporter_id: Optional[int] = None
    province_id: Optional[str] = None
    FleetCardStatus: Optional[int] = None
    POSUsing: Optional[int] = None
    active: Optional[int] = 1 # A default of 1 (active) is good practice
    area_id: Optional[int] = None


# --- Schemas for Creating & Updating ---
class StationInfoCreate(StationInfoBase):
    station_id: str
    station_name: str

class StationInfoUpdate(StationInfoBase):
    pass


# --- Schema for API Responses (Reading Data) ---
# This is the most important one for fixing the "N/A" issue.
class StationInfo(StationInfoBase):
    id: int

    # FIX: Include the nested objects that the API now sends
    am_control: Optional[AMControlSimple] = None
    supporter: Optional[SupporterSimple] = None
    province: Optional[ProvinceSimple] = None

    class Config:
        from_attributes = True