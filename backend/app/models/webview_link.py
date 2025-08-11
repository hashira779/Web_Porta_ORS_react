# app/models/webview_link.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class WebViewLink(Base):
    __tablename__ = "webview_links"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # --- ADDED TIMESTAMPS ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())