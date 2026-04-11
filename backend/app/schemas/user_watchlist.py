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
    added_price: float
    source: str
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None

class WatchlistAdd(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None

class Watchlist(WatchlistBase):
    id: int
    user_id: int
    added_date: datetime
    current_price: Optional[float] = None
    profit_loss_abs: Optional[float] = None
    profit_loss_pct: Optional[float] = None

    class Config:
        from_attributes = True

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
