from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

# Use the same Base as your other models to ensure relationships work.
# A common practice is to define Base once in a central file and import it.
# For this example, we'll redefine it, but ensure it's consistent in your project.
Base = declarative_base()

class Province(Base):
    __tablename__ = 'provinces'
    id = Column(String(10), primary_key=True)
    name = Column(String(255))
    description = Column(Text)
    # Add other fields as needed

class AMControl(Base):
    __tablename__ = 'am_control'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)

class Supporter(Base):
    __tablename__ = 'supporter'
    id = Column(Integer, primary_key=True)
    supporter_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)

class StationInfo(Base):
    __tablename__ = 'station_info'
    id = Column(Integer, primary_key=True)
    station_ID = Column(String(11), nullable=False)
    station_name = Column(String(500))
    
    # Foreign Keys
    am_control_id = Column(Integer, ForeignKey('am_control.id'))
    supporter_id = Column(Integer, ForeignKey('supporter.id'))
    province_id = Column(String(10), ForeignKey('provinces.id'))
    
    # --- Relationships ---
    # These tell SQLAlchemy how to join the tables
    am_control = relationship("AMControl")
    supporter = relationship("Supporter")
    province = relationship("Province")