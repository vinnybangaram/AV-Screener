from app.database import SessionLocal
from app.models.user import User
from app.dashboard.engine import DashboardEngine
from datetime import datetime
import asyncio

async def job_rebuild_dashboard_cache():
    """
    Precompute metrics for all users.
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            for tab in ["investment", "intraday"]:
                for filter_type in ["today", "week", "month", "year"]:
                    # This call will automatically update the cache
                    await DashboardEngine.get_summary(db, user.id, tab, filter_type)
        print(f"[Job] Dashboard cache rebuild complete for {len(users)} users.")
    except Exception as e:
        print(f"[Job] Cache rebuild failed: {e}")
    finally:
        db.close()
