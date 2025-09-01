from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class APIKeyBase(BaseModel):
    scope: str = "external_sales"
    name: Optional[str] = None # Add name here

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyUpdate(BaseModel):
    name: Optional[str] = None

class APIKey(APIKeyBase):
    id: str
    key: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True