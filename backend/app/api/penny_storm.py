from fastapi import APIRouter
from app.services.penny_storm_service import run_penny_storm_scan

router = APIRouter(prefix="/api/penny-storm", tags=["Penny Storm"])

@router.get("/scan")
async def scan_penny_storm():
    results = await run_penny_storm_scan()
    return {"success": True, "data": results}