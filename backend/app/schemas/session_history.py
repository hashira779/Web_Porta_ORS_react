from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Schema for a single detailed history entry
class SessionHistoryDetail(BaseModel):
    id: int
    login_time: datetime
    logout_time: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        orm_mode = True

# Schema for the summary view (user + login count)
class UserHistorySummary(BaseModel):
    user_id: int
    username: str
    session_count: int

    class Config:
        orm_mode = True

# Schema for the response of the user detail endpoint
class UserHistoryResponse(BaseModel):
    username: str
    history: List[SessionHistoryDetail]