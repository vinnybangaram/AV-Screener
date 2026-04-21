from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class OptionTradeBase(BaseModel):
    symbol: str
    instrument: str
    type: str
    entry_price: float
    sl_price: float
    tsl_1: Optional[float] = None
    tsl_2: Optional[float] = None
    tsl_3: Optional[float] = None
    reason: str

class OptionTradeCreate(OptionTradeBase):
    pass

class OptionTradeUpdate(BaseModel):
    exit_price: Optional[float] = None
    status: Optional[str] = None
    exit_reason: Optional[str] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    exit_time: Optional[datetime] = None

class OptionTradeResponse(OptionTradeBase):
    id: int
    status: str
    pnl: float
    pnl_pct: float
    execution_time: datetime
    exit_time: Optional[datetime] = None
    exit_reason: Optional[str] = None
    partial_booked: bool = False
    active_multiplier: float = 1.0
    realized_partial_pnl: float = 0.0

    class Config:
        from_attributes = True

class OptionSettingsBase(BaseModel):
    lots: int
    max_trades_day: int
    risk_mode: str
    auto_execute: bool
    whatsapp_alerts: bool = False
    phone_number: Optional[str] = None

class OptionSettingsUpdate(BaseModel):
    lots: Optional[int] = None
    max_trades_day: Optional[int] = None
    risk_mode: Optional[str] = None
    auto_execute: Optional[bool] = None
    whatsapp_alerts: Optional[bool] = None
    phone_number: Optional[str] = None

class OptionSettingsResponse(OptionSettingsBase):
    updated_at: datetime

    class Config:
        from_attributes = True

class OptionSignalsDashboard(BaseModel):
    today_pnl: float
    engine_status: str
    signal_status: str
    active_trades_count: int
    win_rate: float
    signals_today: int
    trades: List[OptionTradeResponse]
    nifty_live: Optional[dict] = None
    banknifty_live: Optional[dict] = None
