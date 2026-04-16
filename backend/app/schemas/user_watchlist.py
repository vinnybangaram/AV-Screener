from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WatchlistBase(BaseModel):
    symbol: str
    entry_price: float
    category: str # multibagger / intraday / penny / manual
    source_module: Optional[str] = None
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None
    quantity: int = 1

class WatchlistAdd(BaseModel):
    symbol: str
    entry_price: Optional[float] = None # If None, fetch live price
    category: str
    source_module: Optional[str] = "Manual Entry"

class WatchlistUpdate(BaseModel):
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None
    is_active: Optional[bool] = None

class Watchlist(WatchlistBase):
    id: int
    user_id: int
    added_at: datetime
    is_active: bool
    status: str = "ACTIVE"
    latest_price: Optional[float] = None
    latest_pnl: Optional[float] = None
    latest_pnl_percent: Optional[float] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class PositionSnapshot(BaseModel):
    id: int
    position_id: int
    symbol: str
    price: float
    pnl: float
    pnl_percent: float
    captured_at: datetime
    interval_type: str

    class Config:
        from_attributes = True

class DashboardChartData(BaseModel):
    labels: List[str]
    datasets: List[dict]

class NotificationBase(BaseModel):
    symbol: str
    message: str
    type: str

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
