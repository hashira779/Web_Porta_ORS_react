# app/schemas/telegram.py
from pydantic import BaseModel
from typing import List
from datetime import date

class SendReportRequest(BaseModel):
    start_date: date
    end_date: date
    roles: List[str]
    # notice there is no 'format' field here