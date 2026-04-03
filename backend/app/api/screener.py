from fastapi import APIRouter
from app.services.screener_service import run_screener_on_tickers
from app.schemas.screener_schema import ScreenerResponse

router = APIRouter()

# In-memory "cache" for now to satisfy the <2sec requirement after first load
_cached_results = None

@router.get("/", response_model=ScreenerResponse)
def get_screener_results(refresh: bool = False):
    global _cached_results
    
    if _cached_results is None or refresh:
        # Run calculation
        results = run_screener_on_tickers()
        _cached_results = {
            "top_stocks": results,
            "timeframe_mode": "Short-term (2-5 weeks)"
        }
        
    return _cached_results
