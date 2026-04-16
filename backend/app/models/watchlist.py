from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class WatchlistPosition(Base):
    __tablename__ = "watchlist_positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    company_name = Column(String, nullable=True)
    category = Column(String) # multibagger / intraday / penny / manual
    source_module = Column(String, nullable=True) # Multibagger Screener, Intraday Radar, etc.
    
    added_at = Column(DateTime, default=datetime.utcnow)
    entry_price = Column(Float)
    quantity = Column(Integer, default=1)
    
    is_active = Column(Boolean, default=True)
    removed_at = Column(DateTime, nullable=True)
    
    # Real-time tracking fields
    latest_price = Column(Float, nullable=True)
    latest_pnl = Column(Float, nullable=True)
    latest_pnl_percent = Column(Float, nullable=True)
    highest_price_seen = Column(Float, nullable=True)
    lowest_price_seen = Column(Float, nullable=True)
    
    # Risk management fields (kept for compatibility)
    status = Column(String, default="ACTIVE") # ACTIVE, SL_HIT, TARGET_HIT
    stop_loss = Column(Float, nullable=True)
    target_price = Column(Float, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to snapshots
    snapshots = relationship("PositionSnapshot", back_populates="position", cascade="all, delete-orphan")

class PositionSnapshot(Base):
    __tablename__ = "position_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("watchlist_positions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    
    price = Column(Float)
    pnl = Column(Float)
    pnl_percent = Column(Float)
    
    captured_at = Column(DateTime, default=datetime.utcnow, index=True)
    interval_type = Column(String) # hourly / eod

    # Relationships
    position = relationship("WatchlistPosition", back_populates="snapshots")
