from pydantic import BaseModel
from typing import Optional, List

class StockScore(BaseModel):
    fundamental_score: float
    momentum_score: float
    volume_score: float
    sector_score: float
    risk_score: float
    final_score: float

class ScreenerResultItem(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    score: float
    confidence_level: str # High / Medium / Low
    signal_classification: str # Strong Buy / Buy / Watchlist
    reason: str # AI-generated explanation
    scores_breakdown: StockScore

class ScreenerResponse(BaseModel):
    top_stocks: List[ScreenerResultItem]
    timeframe_mode: str
