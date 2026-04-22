from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from app.database import Base
from datetime import datetime

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=True) # If stock specific
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    content_url = Column(String(1000), nullable=True)
    source = Column(String(100), nullable=True)
    sentiment = Column(String(20), nullable=True) # Bullish, Bearish, Neutral
    sentiment_score = Column(Float, default=0.0)
    sector = Column(String(50), nullable=True)
    image_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, nullable=True)
