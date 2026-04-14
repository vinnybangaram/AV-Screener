from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from app.database import Base
from datetime import datetime

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String) # Bug, Suggestion, Accuracy, etc.
    rating = Column(Integer)
    message = Column(Text)
    page_context = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StockComment(Base):
    __tablename__ = "stock_comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    message = Column(Text)
    parent_id = Column(Integer, ForeignKey("stock_comments.id"), nullable=True) # For replies
    likes = Column(Integer, default=0)
    reports = Column(Integer, default=0)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ShareTrack(Base):
    __tablename__ = "share_tracks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    platform = Column(String) # WhatsApp, Twitter, etc.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
