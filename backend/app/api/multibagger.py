from fastapi import APIRouter, Query
from app.services.screener_service import run_screener_on_tickers

router = APIRouter(prefix="/api/multibagger", tags=["Multibagger Discovery"])

@router.get("/")
@router.get("")
async def get_multibagger_candidates(refresh: bool = Query(False)):
    """
    Multibagger Discovery Terminal - Specialized screen for high-conviction momentum plays.
    """
    # Multibaggers typically require higher AI scores (e.g., > 70)
    # and strong fundamental alignment.
    filters = {
        "score_min": 70,
        "refresh": refresh
    }
    
    results = run_screener_on_tickers(filters=filters)
    
    return {
        "success": True,
        "data": results,
        "discovery_mode": "High Conviction Momentum"
    }
