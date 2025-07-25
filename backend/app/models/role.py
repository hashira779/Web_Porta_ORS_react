from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

role_permissions = Table('role_permissions', Base.metadata,
                         Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
                         Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
                         )

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255))

    users = relationship("UserDB", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = 'permissions'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False) # e.g., "users:delete", "reports:export"
    description = Column(String(255))

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")