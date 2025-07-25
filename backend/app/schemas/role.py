from pydantic import BaseModel
from typing import List, Optional

# Add this new schema
class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Permission(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permission_ids: List[int] = []

class RoleUpdate(RoleBase):
    permission_ids: List[int] = []

class Role(RoleBase):
    id: int
    permissions: List[Permission] = []
    class Config:
        from_attributes = True