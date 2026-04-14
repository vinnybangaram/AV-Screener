from fastapi import APIRouter, HTTPException
from app.services.trade_setup_engine import engine
import time

router = APIRouter()

# Cache for 5-10 min
_cache = {}
CACHE_TTL = 300 # 5 minutes

@router.get("/trade-setup/{symbol}")
async def get_trade_setup(symbol: str):
    """
    Returns a managed trade setup (Breakout/Pullback/etc) with entry, sl, and targets.
    Derived from market structure, pivots, and signal confluence.
    """
    now = time.time()
    if symbol in _cache:
        cached_data, timestamp = _cache[symbol]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        setup = engine.generate_setup(symbol)
        _cache[symbol] = (setup, now)
        return setup
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[TradeSetup Error] {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal planning engine error")
