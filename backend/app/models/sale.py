from pydantic import BaseModel
from typing import Optional
from datetime import date

class Sale(BaseModel):
    ID_Type: Optional[str] = None
    STATION_ID: Optional[str] = None
    STATION: Optional[str] = None
    AM_Name: Optional[str] = None
    province_name: Optional[str] = None
    date_completed: Optional[date] = None
    MAT_ID: Optional[str] = None
    PAYMENT: Optional[str] = None
    SHIFT_ID: Optional[int] = None
    total_valume: Optional[float] = None
    total_amount: Optional[float] = None

    class Config:
        from_attributes = True