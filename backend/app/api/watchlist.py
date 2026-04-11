from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user_watchlist import Watchlist as WatchlistSchema, WatchlistAdd, WatchlistUpdate
from app.services import watchlist_service
from typing import List

router = APIRouter()

@router.get("", response_model=List[WatchlistSchema])
def get_watchlist(user_id: int = Query(...), db: Session = Depends(get_db)):
    return watchlist_service.get_watchlist(db, user_id)

@router.post("/add", response_model=WatchlistSchema)
def add_to_watchlist(watchlist_in: WatchlistAdd, user_id: int = Query(...), db: Session = Depends(get_db)):
    return watchlist_service.add_to_watchlist(db, user_id, watchlist_in)

@router.put("/update", response_model=WatchlistSchema)
def update_watchlist(watchlist_id: int, watchlist_in: WatchlistUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    item = watchlist_service.update_watchlist(db, user_id, watchlist_id, watchlist_in)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return item

@router.delete("/remove")
def remove_from_watchlist(watchlist_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    success = watchlist_service.remove_from_watchlist(db, user_id, watchlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return {"success": True}
