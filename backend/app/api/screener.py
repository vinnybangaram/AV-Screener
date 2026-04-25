from fastapi import APIRouter, Query, Request
from app.services.screener_service import run_screener_on_tickers
from typing import Optional

router = APIRouter()

@router.post("")
async def get_screener_results(
    request: Request,
    page: int = Query(1),
    page_size: int = Query(20),
    search: Optional[str] = Query(None)
):
    """
    Enhanced Screener API with Pagination, Search, and Modular Ranking.
    """
    try:
        try:
            filters = await request.json()
        except:
            filters = {}
            
        results = run_screener_on_tickers(
            filters=filters, 
            page=page, 
            page_size=page_size, 
            search=search
        )
        return results
    except Exception as e:
        import traceback
        print(f"❌ [ScreenerAPI] Internal Error: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}