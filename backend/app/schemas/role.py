from pydantic import BaseModel
from typing import List, Optional

# --- Base Schemas ---
class PermissionBase(BaseModel):
    name: str

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

# --- Schemas for Reading Data ---
class Permission(PermissionBase):
    id: int
    description: Optional[str] = None
    class Config:
        from_attributes = True

class Role(RoleBase):
    id: int
    permissions: List[Permission] = []
    class Config:
        from_attributes = True

# --- Schemas for Creating/Updating Data ---
class PermissionCreate(PermissionBase):
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    permission_ids: List[int]

class RoleDetailsUpdate(BaseModel):
    name: str
    description: Optional[str] = None