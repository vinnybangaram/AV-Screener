from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class SavedBacktest(Base):
    __tablename__ = "saved_backtests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    strategy_id = Column(String)
    symbol = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    initial_capital = Column(Float)
    risk_pct = Column(Float)
    
    # Store the results snapshot
    stats = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="backtests")
