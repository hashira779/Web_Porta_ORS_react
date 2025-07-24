from sqlalchemy import Column, Integer, String, Float, DateTime
from .user import Base # Import Base from the user model

class Sale(Base):
    """
    SQLAlchemy model template for sales data.
    Marked as abstract since it represents multiple tables.
    """
    __abstract__ = True

    ID = Column(Integer, primary_key=True)
    MAT_ID = Column(String(255))
    VALUE = Column(Float)
    UNIT_PRICE = Column(Float)
    AMOUNT = Column(Float)
    POS_ID = Column(Integer)
    SHIFT_ID = Column(Integer)
    PAYMENT = Column(String(50))
    COMPLETED_TS = Column(DateTime)
    BUS_DATE = Column(DateTime)
    STATION_ID = Column(String(255))