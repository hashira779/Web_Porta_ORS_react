from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserNested(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class APIKeyBase(BaseModel):
    scope: str = "external_sales"
    name: Optional[str] = None

class APIKeyCreate(APIKeyBase):
    user_id: Optional[int] = None

class APIKeyUpdate(BaseModel):
    name: Optional[str] = None

class APIKey(APIKeyBase):
    id: str
    key: str
    is_active: bool
    created_at: datetime
    owner: Optional[UserNested] = None

    class Config:
        from_attributes = True