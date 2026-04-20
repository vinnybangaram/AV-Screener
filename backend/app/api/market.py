from fastapi import APIRouter, Depends
from app.database import get_db
from app.services import market_service
from typing import Dict, List, Any

router = APIRouter()

@router.get("/top-movers")
async def get_top_movers():
    return await market_service.get_top_movers()

@router.get("/context")
async def get_market_context():
    return await market_service.get_market_context()

@router.get("/indices")
async def get_indices():
    return await market_service.get_market_indices()

@router.get("/ticker")
async def get_ticker():
    return await market_service.get_ticker_data()

@router.get("/regime/current")
def get_market_regime(db: Any = Depends(get_db)):
    from app.services import regime_service
    return regime_service.calculate_current_regime(db)

@router.get("/regime/history")
def get_regime_history(days: int = 30, db: Any = Depends(get_db)):
    from app.services import regime_service
    return regime_service.get_regime_history(db, days)
