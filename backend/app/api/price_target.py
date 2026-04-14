from fastapi import APIRouter, HTTPException
from app.services.price_target_engine import engine
import time

router = APIRouter()

# Cache for 5-10 min
_cache = {}
CACHE_TTL = 600 # 10 minutes

@router.get("/price-target/{symbol}")
async def get_price_targets(symbol: str):
    """
    Returns scenario-based price targets (Bearish, Base, Bullish)
    for 7D, 30D, 90D, and 180D horizons.
    """
    now = time.time()
    if symbol in _cache:
        cached_data, timestamp = _cache[symbol]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        targets = engine.generate_targets(symbol)
        _cache[symbol] = (targets, now)
        return targets
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[PriceTarget Error] {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal forecasting engine error")
