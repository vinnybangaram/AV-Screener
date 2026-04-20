from fastapi import APIRouter
from app.services.penny_storm_service import run_penny_storm_scan

router = APIRouter(prefix="/api/penny-storm", tags=["Penny Storm"])

@router.get("/scan")
async def scan_penny_storm(refresh: bool = False):
    """
    Penny Storm Radar - Identifying high-velocity assets under ₹100.
    """
    results = await run_penny_storm_scan()
    return {"success": True, "data": results}

# ── DEBUG endpoint for NSE data source ──
@router.get("/debug")
async def debug_nse():
    try:
        import httpx
        HEADERS = {
            "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept":          "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer":         "https://www.nseindia.com",
        }
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            await client.get("https://www.nseindia.com")
            r = await client.get(
                "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20250"
            )
            return {
                "status_code": r.status_code,
                "keys":        list(r.json().keys()) if r.status_code == 200 else [],
                "data_count":  len(r.json().get("data", [])),
                "raw_sample":  r.json().get("data", [])[:2],
                "error":       None
            }
    except Exception as e:
        return {"error": str(e), "status_code": None}