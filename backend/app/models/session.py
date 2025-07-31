from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ActiveSession(Base):
    __tablename__ = 'active_sessions'

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)

    # 👇 THIS IS THE LINE TO CHANGE
    # Point the ForeignKey to the correct table name 'users_tb.id'
    user_id = Column(Integer, ForeignKey('users_tb.id'), nullable=False)

    username = Column(String(50), nullable=False)
    login_time = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")