from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services import dashboard_service, snapshot_service

router = APIRouter()

@router.get("/")
@router.get("")
async def get_dashboard(
    category: str = Query("All"),
    timeframe: str = Query("This Month"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Unified endpoint for the high-fidelity Bloomberg Dashboard.
    Strictly Auth-Protected.
    """
    return await dashboard_service.get_dashboard_data(db, user.id, category, timeframe)

@router.post("/snapshots/run")
def run_snapshots(
    interval: str = Query("hourly"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Manually trigger a snapshot run. Restricted to Admin in production.
    """
    if user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    snapshot_service.run_snapshot_job(interval)
    return {"message": "Snapshot job triggered successfully"}

@router.get("/metrics")
def get_dashboard_metrics(
    user_id: int, 
    category: str = Query("All"),
    db: Session = Depends(get_db),
):
    """
    Legacy Metrics Endpoint - updated for new schema.
    """
    data = dashboard_service.get_dashboard_data(db, user_id, category)
    return data["user"]["metrics"]
