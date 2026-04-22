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
    return await dashboard_service.get_dashboard_data(db, user.id, category, timeframe)

@router.get("/summary")
async def get_summary(
    filter: str = Query("today"),   # today | week | month | year
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns separate Investment and Intraday totals for the dashboard header.
    """
    from app.dashboard.engine import DashboardEngine
    inv = await DashboardEngine.get_summary(db, user.id, "investment", filter)
    intra = await DashboardEngine.get_summary(db, user.id, "intraday", filter)
    
    return {
        "investment": {
            "dayPnL": inv.get("dayPnL", 0),
            "overallPnL": inv.get("overallPnL", 0),
            "totalValue": inv.get("totalValue", 0)
        },
        "intraday": {
            "todayPnL": intra.get("dayPnL", 0),
            "weekPnL": intra.get("overallPnL", 0) if filter == "week" else 0,
            "overallPnL": intra.get("overallPnL", 0)
        }
    }

@router.get("/stocks")
async def get_stocks(
    tab: str = Query("investment"),
    subTab: str = Query("all"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Fetches filtered stock list with live PnL.
    """
    from app.dashboard.engine import DashboardEngine
    return await DashboardEngine.get_stocks(db, user.id, tab, subTab)

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
