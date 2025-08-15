from pydantic import BaseModel
from typing import Optional

class AMControl(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Supporter(BaseModel):
    id: int
    supporter_name: str
    class Config:
        from_attributes = True

class Province(BaseModel):
    id: str
    name: Optional[str] = None
    class Config:
        from_attributes = True