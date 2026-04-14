from fastapi import APIRouter, HTTPException, Query
from app.services.forecast_engine import engine
from typing import Optional
import time

router = APIRouter()

# Simple in-memory cache for forecasts (5-15 min as requested)
# In production, Redis or a proper cache would be better.
_cache = {}
CACHE_TTL = 300 # 5 minutes

@router.get("/forecast/{symbol}")
async def get_stock_forecast(
    symbol: str, 
    horizon: str = Query("30D", regex="^(7D|30D|90D)$")
):
    """
    Returns a probability-based forecast for a given stock.
    Supported horizons: 7D, 30D, 90D
    """
    cache_key = f"{symbol}_{horizon}"
    now = time.time()
    
    if cache_key in _cache:
        cached_data, timestamp = _cache[cache_key]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        forecast = engine.generate_forecast(symbol, horizon)
        _cache[cache_key] = (forecast, now)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Forecast Error] {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal engine error during forecast generation")
