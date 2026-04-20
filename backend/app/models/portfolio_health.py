from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base
from datetime import datetime

class PortfolioHealthSnapshot(Base):
    __tablename__ = "portfolio_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow, index=True)
    
    health_score = Column(Float)
    risk_level = Column(String(50)) # Low, Medium, High, Critical
    
    # Granular Factor Scores (0-100)
    diversification_score = Column(Float)
    concentration_score = Column(Float)
    volatility_score = Column(Float)
    correlation_score = Column(Float)
    drawdown_score = Column(Float)
    cash_score = Column(Float)
    
    # Qualitative Data
    top_warning = Column(String(255))
    recommendation = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
