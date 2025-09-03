from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enum with all your possible scopes
class APIScope(str, Enum):
    AM_SALES_REPORT = "am_sales_report"
    AM_SUMMARY_REPORT = "am_summary_report"
    EXTERNAL_SALES = "external_sales"

class UserNested(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class APIKeyBase(BaseModel):
    scope: APIScope = APIScope.EXTERNAL_SALES # Use the Enum with a default
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