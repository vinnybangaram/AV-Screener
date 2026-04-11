from fastapi import APIRouter
from app.services.intraday_service import run_intraday_scan, is_market_open

router = APIRouter(prefix="/api/intraday", tags=["Intraday"])

_cache = {"data": None, "timestamp": None}

@router.get("/scan")
async def intraday_scan(refresh: bool = False):
    from datetime import datetime
    now = datetime.now()

    # Cache for 15 mins during market hours
    if (
        not refresh
        and _cache["data"]
        and _cache["timestamp"]
        and (now - _cache["timestamp"]).seconds < 900
    ):
        return {"success": True, "data": _cache["data"], "cached": True}

    result = await run_intraday_scan()
    _cache["data"]      = result
    _cache["timestamp"] = now
    return {"success": True, "data": result, "cached": False}


@router.get("/status")
def market_status():
    return {"market_open": is_market_open()}