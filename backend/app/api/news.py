from fastapi import APIRouter, Path
from app.services import news_service
from typing import List, Dict, Any

router = APIRouter()

@router.get("/{symbol}")
def get_news(symbol: str = Path(...)):
    return news_service.get_stock_news(symbol)
