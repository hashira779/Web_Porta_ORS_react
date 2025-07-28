from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from .user import user_area_association, user_station_association

class Area(Base):
    __tablename__ = 'areas_tb'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)

    stations = relationship('Station', back_populates='area')
    managers = relationship("User", secondary=user_area_association, back_populates="managed_areas")

class Station(Base):
    __tablename__ = 'station_info'
    id = Column(Integer, primary_key=True, index=True)
    station_ID = Column(String(11))
    station_name = Column(String(500))
    Province = Column(String(255))
    AM_Control = Column(Text)
    active = Column(Boolean, default=True)

    area_id = Column(Integer, ForeignKey('areas_tb.id'), nullable=True) # CORRECTED FK
    area = relationship('Area', back_populates='stations')

    owners = relationship("User", secondary=user_station_association, back_populates="owned_stations")