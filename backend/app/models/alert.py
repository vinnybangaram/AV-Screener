from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from app.database import Base
from datetime import datetime

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    type = Column(String) # TARGET_HIT, SL_HIT, BREAKOUT, SETUP_ACTIVATED, TREND_WEAKENING
    priority = Column(String) # Critical, High, Medium, Low
    title = Column(String)
    message = Column(Text)
    action = Column(String, nullable=True) # CTA text
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
