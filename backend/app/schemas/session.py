from pydantic import BaseModel
from datetime import datetime

class ActiveSession(BaseModel):
    user_id: int
    username: str
    login_time: datetime

    class Config:
        orm_mode = True