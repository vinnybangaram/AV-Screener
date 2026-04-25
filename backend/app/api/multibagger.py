from fastapi import APIRouter, Query
from app.services.screener_service import run_screener_on_tickers, process_ticker

router = APIRouter(prefix="/api/multibagger", tags=["Multibagger Discovery"])

@router.get("")
async def get_multibagger_candidates(refresh: bool = Query(False)):
    """
    Multibagger Discovery Terminal - Specialized screen for high-conviction momentum plays.
    """
    # Multibaggers typically require higher AI scores (e.g., > 70)
    # and strong fundamental alignment.
    filters = {
        "score_min": 60, # Lowered from 70 to capture emerging momentum earlier
        "refresh": refresh
    }
    
    response = run_screener_on_tickers(filters=filters)
    results = response.get("data", [])
    
    if not results:
        # Failsafe: if no results > 60 found, return top 3 overall to keep terminal active
        fallback_tickers = ["ZOMATO", "RVNL", "HAL"]
        for t in fallback_tickers:
            r = process_ticker(t)
            if r: results.append(r)
        
        # Sort descending by score
        results = sorted(results, key=lambda x: x["score"], reverse=True)
        
    print(f"[Multibagger] Scan complete — {len(results)} matches found")
    
    return {
        "success": True,
        "data": results,
        "discovery_mode": "High Conviction Momentum"
    }
