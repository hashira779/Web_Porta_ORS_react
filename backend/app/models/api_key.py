import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class APIKey(Base):
    __tablename__ = 'api_keys'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # --- ADD THIS LINE ---
    # This column was missing from your model.
    name = Column(String(100), nullable=True, index=True)

    key = Column(String(255), unique=True, index=True, nullable=False)
    scope = Column(String(50), nullable=False, index=True)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime, default=func.now())
    created_by_id = Column(Integer, ForeignKey('users_tb.id'), nullable=False)

    creator = relationship("User", back_populates="api_keys")