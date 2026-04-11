from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services import dashboard_service

router = APIRouter()

@router.get("/")
@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Unified endpoint for the high-fidelity Bloomberg Dashboard.
    Strictly Auth-Protected.
    """
    return dashboard_service.get_dashboard_data(db, user.id)

@router.get("/metrics")
def get_dashboard_metrics(
    user_id: int, 
    db: Session = Depends(get_db),
    # Temporarily allow manual user_id for legacy support, but we recommend migrating to get_dashboard
):
    """
    Legacy Metrics Endpoint.
    Still useful for some targeted UI updates.
    """
    from app.services import watchlist_service
    watchlist = watchlist_service.get_watchlist(db, user_id)
    if not watchlist:
        return {
            "total_value": 0, "total_pl_abs": 0, "total_pl_pct": 0,
            "best_performer": None, "worst_performer": None
        }
    
    total_value = sum(item["current_price"] for item in watchlist)
    total_pl_abs = sum(item["profit_loss_abs"] for item in watchlist)
    avg_entry = sum(item["added_price"] for item in watchlist)
    total_pl_pct = (total_pl_abs / avg_entry) * 100 if avg_entry > 0 else 0
    
    best = max(watchlist, key=lambda x: x["profit_loss_pct"])
    worst = min(watchlist, key=lambda x: x["profit_loss_pct"])
    
    return {
        "total_value": round(total_value, 2),
        "total_pl_abs": round(total_pl_abs, 2),
        "total_pl_pct": round(total_pl_pct, 2),
        "best_performer": {"symbol": best["symbol"], "pl_pct": round(best["profit_loss_pct"], 2)},
        "worst_performer": {"symbol": worst["symbol"], "pl_pct": round(worst["profit_loss_pct"], 2)}
    }
