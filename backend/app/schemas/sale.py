from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Sale(BaseModel):
    """
    Defines the structure of a single sales record returned by the API.
    """
    ID: int
    MAT_ID: Optional[str] = None
    VALUE: Optional[float] = None
    UNIT_PRICE: Optional[float] = None
    AMOUNT: Optional[float] = None
    POS_ID: Optional[int] = None
    SHIFT_ID: Optional[int] = None
    PAYMENT: Optional[str] = None
    COMPLETED_TS: Optional[datetime] = None
    BUS_DATE: Optional[datetime] = None
    STATION_ID: Optional[str] = None

    class Config:
        from_attributes = True