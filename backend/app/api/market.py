from fastapi import APIRouter
from app.services import market_service
from typing import Dict, List, Any

router = APIRouter()

@router.get("/top-movers")
def get_top_movers():
    return market_service.get_top_movers()
