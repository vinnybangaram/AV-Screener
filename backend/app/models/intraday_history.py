from sqlalchemy import Column, Integer, String, Float, DateTime, Date
from app.database import Base
from datetime import datetime

class IntradayHistory(Base):
    __tablename__ = "intraday_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    side = Column(String) # long | short
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    pnl_percent = Column(Float, nullable=True)
    date = Column(Date, index=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
