from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user_watchlist import Watchlist as WatchlistSchema, WatchlistAdd, WatchlistUpdate
from app.services import watchlist_service
from app.utils.auth import get_current_user
from app.models.user import User
from typing import List

router = APIRouter()

@router.get("", response_model=List[WatchlistSchema])
def get_watchlist(
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Fetch active watchlist for the current user.
    """
    return watchlist_service.get_watchlist(db, user.id)

@router.post("/add", response_model=WatchlistSchema)
def add_to_watchlist(
    watchlist_in: WatchlistAdd, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Add a new symbol to watchlist and capture entry price.
    """
    return watchlist_service.add_to_watchlist(db, user.id, watchlist_in)

@router.put("/update", response_model=WatchlistSchema)
def update_watchlist(
    watchlist_id: int, 
    watchlist_in: WatchlistUpdate, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Update SL/Target or Activity status.
    """
    item = watchlist_service.update_watchlist(db, user.id, watchlist_id, watchlist_in)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return item

@router.post("/remove")
@router.delete("/remove")
def remove_from_watchlist(
    watchlist_id: int, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Soft-remove from active view while preserving historical snapshots.
    """
    success = watchlist_service.remove_from_watchlist(db, user.id, watchlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return {"success": True}
