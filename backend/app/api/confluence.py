from fastapi import APIRouter, HTTPException
from app.services.confluence_engine import engine
import time

router = APIRouter()

# Simple cache for scores (5-10 min)
_cache = {}
CACHE_TTL = 600 # 10 minutes

@router.get("/confluence/{symbol}")
async def get_confluence_score(symbol: str):
    """
    Returns the Confluence score (0-100) for a given stock.
    Aggregates trend, momentum, volume, risk, context, and sentiment.
    """
    now = time.time()
    if symbol in _cache:
        cached_data, timestamp = _cache[symbol]
        if now - timestamp < CACHE_TTL:
            return cached_data

    try:
        score_data = engine.generate_score(symbol)
        _cache[symbol] = (score_data, now)
        return score_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Confluence Error] {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal decision engine error")
