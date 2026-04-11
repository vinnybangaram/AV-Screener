from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import notification_service
from app.schemas.user_watchlist import Notification as NotificationSchema
from typing import List

router = APIRouter()

@router.get("", response_model=List[NotificationSchema])
def get_notifications(user_id: int = Query(...), db: Session = Depends(get_db)):
    return notification_service.get_user_notifications(db, user_id)

@router.post("/mark-read")
def mark_read(notification_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    notification_service.mark_notification_read(db, user_id, notification_id)
    return {"success": True}

@router.post("/trigger")
def trigger_test_notification(symbol: str, message: str, type: str, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Internal/Manual trigger for testing."""
    return notification_service.trigger_notification(db, user_id, symbol, message, type)
