from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.upstox_account import UpstoxAccount
from app.services.upstox_service import upstox_service
from typing import Optional, Dict, Any

router = APIRouter(prefix="/upstox", tags=["Upstox Integration"])

@router.get("/login")
async def get_upstox_login_url(user: User = Depends(get_current_user)):
    """Generate the OAuth login URL for Upstox."""
    return {"url": upstox_service.get_login_url()}

@router.post("/callback")
async def upstox_callback(
    code: str = Body(..., embed=True), 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Exchange auth code for access token and save to DB."""
    try:
        # 1. Exchange code for token
        token_data = await upstox_service.get_access_token(code)
        
        # 2. Get profile to identify user
        profile_data = await upstox_service.get_profile(token_data["access_token"])
        
        # 3. Save to DB
        account = upstox_service.save_upstox_account(db, user.id, token_data, profile_data)
        
        return {
            "success": True, 
            "message": "Upstox connected successfully",
            "client_name": account.user_name
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile")
async def get_upstox_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Fetch the connected Upstox profile."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Upstox not connected")
    
    return {
        "connected": True,
        "client_id": account.client_id,
        "user_name": account.user_name,
        "email": account.email
    }

@router.get("/quote")
async def get_upstox_quote(
    symbol: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Fetch live market quote."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Upstox not connected")
    
    try:
        quote = await upstox_service.get_market_quote(account.access_token, symbol)
        return quote
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/candles")
async def get_upstox_candles(
    symbol: str, 
    interval: str = "1minute",
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Fetch historical candle data."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Upstox not connected")
    
    try:
        candles = await upstox_service.get_historical_candles(account.access_token, symbol, interval)
        return candles
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/options")
async def get_upstox_options(
    symbol: str, 
    expiry_date: Optional[str] = None,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Fetch option chain data."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Upstox not connected")
    
    try:
        chain = await upstox_service.get_option_chain(account.access_token, symbol, expiry_date)
        return chain
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/order")
async def place_upstox_order(
    order_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Future ready order placement route (Stub)."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Upstox not connected")
    
    # In a real implementation, we would validate order_data and call upstox_service.place_order
    return {
        "success": True,
        "message": "Order validated. Order execution is disabled in this version.",
        "received_data": order_data
    }

@router.post("/disconnect")
async def disconnect_upstox(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Disconnect Upstox account."""
    account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
    if account:
        db.delete(account)
        db.commit()
    return {"success": True, "message": "Upstox disconnected"}
