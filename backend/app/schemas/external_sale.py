# In: backend/app/schemas/external_sale.py

from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from typing_extensions import Self
from datetime import date

class ExternalSale(BaseModel):
    """
    Pydantic schema for the external sales report.
    Transforms MAT_ID into a human-readable MAT_Name.
    """
    # MAT_ID is used for logic but excluded from the final JSON response.
    MAT_ID: Optional[Any] = Field(None, exclude=True)

    # Fields that will be in the response, in a clear order.
    ID_Type: Optional[str] = None
    STATION_ID: Optional[str] = None
    STATION: Optional[str] = None
    AM_Name: Optional[str] = None
    province_name: Optional[str] = None
    date_completed: Optional[date] = None
    PAYMENT: Optional[str] = None
    SHIFT_ID: Optional[int] = None
    MAT_Name: Optional[str] = None # The new, human-readable field
    total_valume: Optional[float] = None
    total_amount: Optional[float] = None

    @model_validator(mode='after')
    def create_mat_name(self) -> Self:
        """
        Maps MAT_ID to its corresponding name and assigns it to MAT_Name.
        """
        if self.MAT_ID is not None:
            mat_id = str(self.MAT_ID)
            mat_name_map = {
                "500014": "ULG95",
                "500024": "ULR 91",
                "500033": "HSD"
            }
            self.MAT_Name = mat_name_map.get(mat_id, "Unknown Material")
        return self

    class Config:
        from_attributes = True