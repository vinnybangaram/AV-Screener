from pydantic import BaseModel
from typing import Optional, List

class BacktestRequest(BaseModel):
    strategy_id: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    risk_pct: float

class TradeLog(BaseModel):
    date: str
    symbol: str
    side: str
    entry: float
    exit: float
    pnl: float
    hold: str

class BacktestResponse(BaseModel):
    stats: dict
    trades: List[TradeLog]
    equity_curve: List[dict]
