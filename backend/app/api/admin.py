from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.utils.auth import require_admin
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    thirty_days_ago = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar()
    daily_active = db.query(func.count(User.id)).filter(User.last_login >= one_day_ago).scalar()
    monthly_active = db.query(func.count(User.id)).filter(User.last_login >= thirty_days_ago).scalar()
    paid_users = db.query(func.count(User.id)).filter(User.plan != "free").scalar()
    
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    
    return {
        "totalUsers": total_users,
        "dailyActiveUsers": daily_active,
        "monthlyActiveUsers": monthly_active,
        "paidUsers": paid_users,
        "recentUsers": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at,
                "last_login": u.last_login,
                "plan": u.plan
            } for u in recent_users
        ]
    }
