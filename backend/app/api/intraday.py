from fastapi import APIRouter, Depends, Body
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.intraday_service import intraday_service
from typing import Dict, Any

router = APIRouter(prefix="/intraday", tags=["Intraday Trading"])

@router.get("/state")
async def get_intraday_state(user: User = Depends(get_current_user)):
    return await intraday_service.get_engine_state(user.id)

@router.get("/signals")
async def get_intraday_signals(user: User = Depends(get_current_user)):
    return await intraday_service.get_signals(user.id)

@router.post("/toggle")
async def toggle_intraday_engine(
    config: Dict[str, Any] = Body(...),
    user: User = Depends(get_current_user)
):
    return await intraday_service.toggle_engine(user.id, config)

@router.post("/reset")
async def reset_intraday_day(user: User = Depends(get_current_user)):
    return await intraday_service.reset_day(user.id)