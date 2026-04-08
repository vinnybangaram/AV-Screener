from fastapi import APIRouter
from app.services.screener_service import run_screener_on_tickers
from app.schemas.screener_schema import ScreenerResponse

router = APIRouter()

# In-memory cache
_cached_results = None

# 🔥 FIXED ROUTE
@router.get("/", response_model=ScreenerResponse)
def get_screener_results(refresh: bool = False):
    global _cached_results
    
    if _cached_results is None or refresh:
        results = run_screener_on_tickers()
        _cached_results = {
            "success": True,
            "data": results,
            "timeframe_mode": "Short-term (2-5 weeks)"
        }
        
    return _cached_results