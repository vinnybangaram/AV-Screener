from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.utils.auth import require_admin
from datetime import datetime, timedelta

from app.services.admin_service import admin_service
from fastapi.responses import Response

router = APIRouter()

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    """
    Returns high-level user intelligence metrics.
    """
    return admin_service.get_analytics_overview(db)

@router.post("/notify")
async def send_broadcast(
    title: str, 
    message: str, 
    group: str = "all", 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_admin)
):
    """
    Broadcasts a notification to a specific segment of users.
    """
    return admin_service.broadcast_notification(db, title, message, group, current_admin.id)

@router.get("/export/users")
def export_users(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    """
    Generates a CSV report of all registered users.
    """
    csv_data = admin_service.export_users_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=av_screener_users.csv"}
    )
