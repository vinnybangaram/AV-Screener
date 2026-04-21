from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class OptionTrade(Base):
    __tablename__ = "option_trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    symbol = Column(String, index=True)  # Nifty / Banknifty
    instrument = Column(String)  # Nifty 19500 CE
    type = Column(String)  # CALL / PUT
    entry_price = Column(Float)
    sl_price = Column(Float)
    tsl_1 = Column(Float, nullable=True)
    tsl_2 = Column(Float, nullable=True)
    tsl_3 = Column(Float, nullable=True)
    current_tsl = Column(Float, nullable=True)
    tsl_1_hit = Column(Boolean, default=False)
    tsl_2_hit = Column(Boolean, default=False)
    tsl_3_hit = Column(Boolean, default=False)
    
    # Advanced Trade Tracker Fields
    partial_booked = Column(Boolean, default=False)
    trailing_sl = Column(Float, nullable=True)
    active_multiplier = Column(Float, default=1.0)
    realized_partial_pnl = Column(Float, default=0.0)
    
    exit_price = Column(Float, nullable=True)
    status = Column(String)  # OPEN / CLOSED / CANCELLED
    exit_reason = Column(String, nullable=True)  # SL / TSL / Manual
    pnl = Column(Float, default=0.0)
    pnl_pct = Column(Float, default=0.0)
    reason = Column(String)  # Logic behind signal
    execution_time = Column(DateTime, default=datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OptionSettings(Base):
    __tablename__ = "option_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    lots = Column(Integer, default=1)
    max_trades_day = Column(Integer, default=10)
    risk_mode = Column(String, default="Balanced")  # Conservative / Balanced / Aggressive
    auto_execute = Column(Boolean, default=True)
    
    # Notification Settings
    whatsapp_alerts = Column(Boolean, default=False)
    phone_number = Column(String, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
