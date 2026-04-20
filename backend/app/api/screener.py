from fastapi import APIRouter, Query
from app.services.screener_service import run_screener_on_tickers
from typing import Optional

router = APIRouter()


@router.get("/")
def get_screener_results(
    market_cap: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    pe_min: Optional[float] = Query(None),
    pe_max: Optional[float] = Query(None),
    roe_min: Optional[float] = Query(None),
    rsi_min: Optional[float] = Query(None),
    rsi_max: Optional[float] = Query(None),
    score_min: Optional[float] = Query(None),
    risk_level: Optional[str] = Query(None),
    volume_surge: Optional[str] = Query(None),
    pattern: Optional[str] = Query(None),
    refresh: bool = False
):
    filters = {
        "market_cap": market_cap,
        "sector": sector,
        "pe_min": pe_min,
        "pe_max": pe_max,
        "roe_min": roe_min,
        "rsi_min": rsi_min,
        "rsi_max": rsi_max,
        "score_min": score_min,
        "risk_level": risk_level,
        "volume_surge": volume_surge,
        "pattern": pattern
    }
    
    # We remove global caching for the dynamic screener to allow real-time filtering
    results = run_screener_on_tickers(filters=filters)
    return {
        "success": True,
        "data": results,
        "timeframe_mode": "Short-term (2-5 weeks)"
    }