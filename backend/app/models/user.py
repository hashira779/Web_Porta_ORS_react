from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# --- ASSOCIATION TABLES ---
# This is the single source of truth for these relationship tables.
role_permission_association = Table(
    'role_permissions', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

user_area_association = Table(
    'user_area_assignments', Base.metadata,
    Column('user_id', Integer, ForeignKey('users_tb.id'), primary_key=True),
    Column('area_id', Integer, ForeignKey('areas_tb.id'), primary_key=True)
)

user_station_association = Table(
    'user_station_assignments', Base.metadata,
    Column('user_id', Integer, ForeignKey('users_tb.id'), primary_key=True),
    Column('station_id', Integer, ForeignKey('station_info.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users_tb'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    token_version = Column(Integer, nullable=False, server_default='0', default=0)
    role_id = Column(Integer, ForeignKey('roles.id'))
    role = relationship('Role', back_populates='users')

    managed_areas = relationship("Area", secondary=user_area_association, back_populates="managers")
    owned_stations = relationship("Station", secondary=user_station_association, back_populates="owners")