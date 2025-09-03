from pydantic import BaseModel, Field
from typing import List
from datetime import datetime, date

class StationSummary(BaseModel):
    station_id: str = Field(alias='station_ID')
    station_name: str
    province: str = Field(alias='Province')
    total_volume: float = 0.0
    total_amount: float = 0.0

    class Config:
        from_attributes = True
        populate_by_name = True

class AreaSummary(BaseModel):
    id: int
    name: str
    stations: List[StationSummary] = []

    class Config:
        from_attributes = True

class AMReport(BaseModel):
    report_generated_at: datetime = Field(default_factory=datetime.utcnow)
    area_manager_name: str
    start_date: date
    end_date: date
    assigned_areas: List[AreaSummary] = []

    class Config:
        from_attributes = True