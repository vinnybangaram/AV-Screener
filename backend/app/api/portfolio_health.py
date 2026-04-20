from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services import portfolio_health_service

router = APIRouter()

@router.get("/health")
def get_portfolio_health(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns current portfolio health metrics and risk analysis.
    """
    return portfolio_health_service.calculate_portfolio_health(db, user.id)

@router.get("/health/history")
def get_health_history(
    days: int = Query(90),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns historical health score trend.
    """
    history = portfolio_health_service.get_health_history(db, user.id, days)
    return [
        {
            "id": h.id,
            "date": h.date.isoformat(),
            "score": h.health_score,
            "risk_level": h.risk_level
        } for h in history
    ]

@router.post("/health/snapshot")
def trigger_snapshot(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Manually capture a health snapshot.
    """
    return portfolio_health_service.save_health_snapshot(db, user.id)
