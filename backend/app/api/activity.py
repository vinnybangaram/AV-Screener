from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, ActivityEvent
from app.utils.auth import get_current_user

router = APIRouter()

@router.post("/track")
async def track_event(
    event_type: str = Body(...),
    symbol: str = Body(None),
    metadata: dict = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tracks a user activity event for analytics.
    """
    new_event = ActivityEvent(
        user_id=current_user.id,
        event_type=event_type,
        symbol=symbol,
        metadata_json=metadata
    )
    db.add(new_event)
    db.commit()
    return {"status": "success"}
