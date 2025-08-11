from pydantic import BaseModel, ConfigDict
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    # This tells Pydantic to ignore any extra fields (like 'session_id')
    # that are in the token data but not defined in this model.
    model_config = ConfigDict(extra="ignore")

    sub: Optional[str] = None
    user_id: Optional[int] = None
    token_version: Optional[int] = None