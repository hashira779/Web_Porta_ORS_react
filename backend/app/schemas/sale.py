from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from typing_extensions import Self  # Import Self from here for compatibility
from datetime import date

class Sale(BaseModel):
    # MAT_ID is used for logic but excluded from the response.
    # We'll allow any type initially and validate it in the model_validator.
    MAT_ID: Optional[Any] = Field(None, exclude=True)

    # Public fields that will be in the response, in your desired order.
    ID_Type: Optional[str] = None
    STATION_ID: Optional[str] = None
    STATION: Optional[str] = None
    AM_Name: Optional[str] = None
    province_name: Optional[str] = None
    date_completed: Optional[date] = None
    PAYMENT: Optional[str] = None
    SHIFT_ID: Optional[int] = None

    # MAT_Name is now declared here to control its position.
    MAT_Name: Optional[str] = None

    total_valume: Optional[float] = None
    total_amount: Optional[float] = None

    # `@model_validator` is the correct way to do this in Pydantic V2.
    # `mode='after'` means it runs after individual field validation.
    @model_validator(mode='after')
    def create_mat_name(self) -> Self:
        """
        Takes the MAT_ID, maps it to a name, and assigns it to the MAT_Name field.
        """
        if self.MAT_ID is not None:
            # Coerce the incoming value to a string for the mapping logic.
            mat_id = str(self.MAT_ID)

            mat_name_map = {
                "500014": "ULG95",
                "500024": "ULR 91",
                "500033": "HSD"
            }
            # Assign the mapped value directly to the MAT_Name field.
            self.MAT_Name = mat_name_map.get(mat_id)

        return self

    class Config:
        from_attributes = True
