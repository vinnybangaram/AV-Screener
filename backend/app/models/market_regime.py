from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.database import Base
from datetime import datetime

class MarketRegimeSnapshot(Base):
    __tablename__ = "market_regime_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    regime_code = Column(String(10)) # R1 - R8
    regime_name = Column(String(50))
    confidence = Column(Integer) # 0-100
    
    # 5 Major Scores
    trend_score = Column(Integer)
    breadth_score = Column(Integer)
    volatility_score = Column(Integer)
    rotation_score = Column(Integer)
    liquidity_score = Column(Integer)
    
    # High-level metrics
    volatility_label = Column(String(20)) # Low, Moderate, High
    top_sectors = Column(JSON) # List of strings
    weak_sectors = Column(JSON) # List of strings
    
    summary_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
