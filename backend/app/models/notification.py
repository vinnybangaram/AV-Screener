from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.database import Base
from datetime import datetime

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    message = Column(String)
    type = Column(String) 
    priority = Column(String, default="LOW") # LOW, MEDIUM, HIGH
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
