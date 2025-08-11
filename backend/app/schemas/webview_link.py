# app/schemas/webview_link.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime # Import datetime

# Shared properties
class WebViewLinkBase(BaseModel):
    title: str
    url: str
    is_active: Optional[bool] = True

# Properties to receive on item creation
class WebViewLinkCreate(WebViewLinkBase):
    pass

# Properties to receive on item update
class WebViewLinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    is_active: Optional[bool] = None

# Properties to return to client
class WebViewLink(WebViewLinkBase):
    id: int

    # --- ADDED TIMESTAMPS ---
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True