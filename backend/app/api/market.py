from fastapi import APIRouter
from app.services import market_service
from typing import Dict, List, Any

router = APIRouter()

@router.get("/top-movers")
def get_top_movers():
    return market_service.get_top_movers()

@router.get("/context")
def get_market_context():
    return market_service.get_market_context()

@router.get("/indices")
def get_indices():
    return market_service.get_market_indices()

@router.get("/ticker")
def get_ticker():
    return market_service.get_ticker_data()
