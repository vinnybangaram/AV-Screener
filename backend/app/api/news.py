from fastapi import APIRouter, Path, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import news_service
from app.utils.auth import get_current_user
from app.models.user import User
from typing import List, Dict, Any

router = APIRouter(tags=["News & Sentiment"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_general_news(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch global market news with AI-detected sentiment impact.
    """
    return news_service.get_market_news()

@router.get("/{symbol}", response_model=List[Dict[str, Any]])
async def get_stock_specific_news(
    symbol: str = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch historical and real-time news for a specific asset.
    """
    return news_service.get_stock_news(symbol)
@router.get("/sectors", response_model=List[Dict[str, Any]])
async def get_sector_sentiment(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch comprehensive sector sentiment map.
    """
    return news_service.get_sector_sentiment()
