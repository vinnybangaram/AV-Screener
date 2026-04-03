from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
from datetime import datetime

class ScreenerResult(Base):
    __tablename__ = "screener_results"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    company_name = Column(String)
    current_price = Column(Float)
    
    # Scores
    fundamental_score = Column(Float)
    momentum_score = Column(Float)
    volume_score = Column(Float)
    sector_score = Column(Float)
    risk_score = Column(Float)
    final_score = Column(Float, index=True) # Index for fast sorting
    
    # Classifications
    confidence_level = Column(String)
    signal_classification = Column(String)
    reason = Column(String)
    
    # Update time
    updated_at = Column(DateTime, default=datetime.utcnow)
