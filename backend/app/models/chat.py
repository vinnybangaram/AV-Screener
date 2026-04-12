from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from app.database import Base
from datetime import datetime

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    question = Column(String)
    response = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
