from pydantic import BaseModel, validator
from typing import Optional, Any
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

    # CORRECTED: This validator automatically converts any MAT_ID to a string before validation.
    @validator('MAT_ID', pre=True)
    def coerce_mat_id_to_string(cls, v: Any) -> Optional[str]:
        if v is not None:
            return str(v)
        return v

    class Config:
        from_attributes = True