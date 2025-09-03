from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from typing_extensions import Self
from datetime import date, datetime

class ExternalSale(BaseModel):
    MAT_ID: Optional[Any] = Field(None, exclude=True)
    STATION_ID: Optional[str] = None
    MAT_Name: Optional[str] = None
    volume: Optional[float] = Field(None, alias='VALUME')
    unit_price: Optional[float] = Field(None, alias='UNIT_PRICE')
    amount: Optional[float] = Field(None, alias='AMOUNT')
    pos_id: Optional[int] = Field(None, alias='POS_ID')
    shift_id: Optional[int] = Field(None, alias='SHIFT_ID')
    payment_method: Optional[str] = Field(None, alias='PAYMENT')
    completed_at: Optional[datetime] = Field(None, alias='COMPLETED_TS')
    business_date: Optional[date] = Field(None, alias='BUS_DATE')

    @model_validator(mode='after')
    def create_mat_name(self) -> Self:
        if self.MAT_ID is not None:
            mat_id = str(self.MAT_ID)
            mat_name_map = { "500014": "ULG95", "500024": "ULR 91", "500033": "HSD" }
            self.MAT_Name = mat_name_map.get(mat_id, "Unknown Material")
        return self

    class Config:
        from_attributes = True
        populate_by_name = True