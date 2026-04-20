from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from app.database import Base
from datetime import datetime

class StockConvictionScore(Base):
    __tablename__ = "stock_conviction_scores"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    
    score = Column(Float)
    rating = Column(String(50)) # Elite Conviction, Strong Buy Setup, etc.
    
    # Granular Scores (0-100)
    trend_score = Column(Float)
    momentum_score = Column(Float)
    volume_score = Column(Float)
    relative_strength_score = Column(Float)
    risk_score = Column(Float)
    regime_score = Column(Float)
    
    # Meta Data
    entry_zone = Column(String(50)) # Favorable, Neutral, High
    timeframe = Column(String(50)) # Swing / Positional, Intraday, etc.
    summary_text = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
