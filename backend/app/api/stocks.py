from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import conviction_service
from typing import List, Optional

router = APIRouter()

@router.get("/conviction/{symbol}")
def get_stock_conviction(symbol: str, db: Session = Depends(get_db)):
    """
    Returns live conviction score for a single stock.
    """
    return conviction_service.calculate_conviction_score(symbol, db, save=True)

@router.get("/conviction/top")
def get_top_conviction(limit: int = 20, db: Session = Depends(get_db)):
    """
    Returns cached top ranked stocks.
    """
    return conviction_service.get_top_conviction_stocks(db, limit)

@router.get("/conviction/{symbol}/history")
def get_conviction_history(symbol: str, days: int = 30, db: Session = Depends(get_db)):
    """
    Returns historical score movement for a symbol.
    """
    return conviction_service.get_conviction_history(db, symbol, days)
