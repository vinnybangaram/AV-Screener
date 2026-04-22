from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class HoldingBase(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = "Others"
    quantity: float
    avg_price: float

class HoldingCreate(HoldingBase):
    pass

class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    avg_price: Optional[float] = None
    sector: Optional[str] = None

class HoldingResponse(HoldingBase):
    id: int
    user_id: int
    current_price: Optional[float] = 0.0
    pnl: Optional[float] = 0.0
    pnl_percent: Optional[float] = 0.0
    weight: Optional[float] = 0.0

    class Config:
        from_attributes = True

class PortfolioSummary(BaseModel):
    total_invested: float
    total_value: float
    total_pnl: float
    total_pnl_percent: float
    holdings_count: int
    risk_score: float
    holdings: List[HoldingResponse]
    sector_allocation: List[dict] # { "name": "IT", "value": 20.5 }
    rebalance_suggestions: List[dict]
