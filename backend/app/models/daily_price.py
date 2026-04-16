"""
app/models/daily_price.py

Stores one OHLCV row per symbol per trading day.
Used for per-stock candlestick / line charts on the dashboard.
Populated by daily_data_service.fetch_and_store_eod()
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, UniqueConstraint
from app.database import Base
from datetime import datetime


class StockDailyPrice(Base):
    __tablename__ = "stock_daily_prices"

    id          = Column(Integer, primary_key=True, index=True)
    symbol      = Column(String,  index=True, nullable=False)
    date        = Column(Date,    index=True, nullable=False)

    open        = Column(Float, nullable=True)
    high        = Column(Float, nullable=True)
    low         = Column(Float, nullable=True)
    close       = Column(Float, nullable=True)
    volume      = Column(Float, nullable=True)

    # Derived / convenience
    change_pct  = Column(Float, nullable=True)   # (close - prev_close) / prev_close * 100

    captured_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        # One row per symbol per day — safe to call upsert repeatedly
        UniqueConstraint("symbol", "date", name="uq_stock_daily_symbol_date"),
    )
