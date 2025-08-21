# In app/models/station.py

# UPDATED: Make sure all these are imported from sqlalchemy
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

# Assuming these are defined in app/models/user.py
from .user import user_area_association, user_station_association


class Area(Base):
    __tablename__ = 'areas_tb'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    stations = relationship('Station', back_populates='area')
    managers = relationship("User", secondary=user_area_association, back_populates="managed_areas")


class Station(Base):
    __tablename__ = 'station_info'
    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column("station_id", String(11), nullable=False, unique=True)
    station_name = Column(String(500))
    Province = Column("Province", String(255))
    AM_Control = Column(Text)
    Operating = Column(Integer)
    am_control_id = Column(Integer, ForeignKey('am_control.id'))
    supporter_id = Column(Integer, ForeignKey('supporter.id'))
    province_id = Column(String(10), ForeignKey('provinces.id'))
    FleetCardStatus = Column(Integer)
    POSUsing = Column(Integer)
    active = Column(Integer, default=1)
    area_id = Column(Integer, ForeignKey('areas_tb.id'))

    # Existing relationships
    area = relationship('Area', back_populates='stations')
    owners = relationship("User", secondary=user_station_association, back_populates="owned_stations")

    # BEST PRACTICE: Add relationships for the new Foreign Keys
    am_control = relationship("AMControl")
    supporter = relationship("Supporter")
    province = relationship("Province")


class AMControl(Base):
    __tablename__ = 'am_control'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Supporter(Base):
    __tablename__ = 'supporter'
    id = Column(Integer, primary_key=True)
    supporter_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Province(Base):
    __tablename__ = 'provinces'
    id = Column(String(10), primary_key=True)
    name = Column(String(255))
    description = Column(Text)