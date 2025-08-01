from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.base_class import Base

class SessionHistory(Base):
    """
    Database model for storing a permanent record of all user login sessions.
    """
    __tablename__ = 'session_history'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users_tb.id'), nullable=False, index=True)
    login_time = Column(DateTime(timezone=True), nullable=False)
    logout_time = Column(DateTime(timezone=True), nullable=True) # Can be null if session is active
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)