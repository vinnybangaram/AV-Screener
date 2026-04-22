from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.services.intraday_service import run_intraday_scan
from app.models.watchlist import WatchlistPosition
from app.models.intraday_history import IntradayHistory
from app.models.user import User
from datetime import datetime, date, timedelta
import asyncio

async def job_daily_intraday_scan():
    """
    Run scanner automatically.
    Returns picks and adds them to watchlist for all users.
    """
    print(f"[Job] Starting Daily Intraday Scan at {datetime.now()}")
    
    # 1. Run the scan
    results = await run_intraday_scan()
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        
        longs = results.get("longs", [])
        shorts = results.get("shorts", [])
        
        for user in users:
            # Add longs
            for s in longs:
                _add_auto_intraday(db, user.id, s, "long")
            # Add shorts
            for s in shorts:
                _add_auto_intraday(db, user.id, s, "short")
                
        db.commit()
        print(f"[Job] Daily scan complete. Added picks for {len(users)} users.")
    except Exception as e:
        print(f"[Job] Error in daily scan job: {e}")
        db.rollback()
    finally:
        db.close()

def _add_auto_intraday(db: Session, user_id: int, data: dict, sub_type: str):
    # Check if already exists for today/user
    existing = db.query(WatchlistPosition).filter(
        WatchlistPosition.user_id == user_id,
        WatchlistPosition.symbol == data["ticker"],
        WatchlistPosition.category.ilike("%intraday%"),
        func.date(WatchlistPosition.added_at) == date.today()
    ).first()
    
    if not existing:
        new_pos = WatchlistPosition(
            user_id=user_id,
            symbol=data["ticker"],
            category="intraday",
            sub_type=sub_type.lower(), # long | short
            side=sub_type.upper(),
            entry_price=data.get("price", 0),
            quantity=1,
            is_auto_generated=True,
            expires_at=datetime.utcnow() + timedelta(days=1), # Expire tomorrow before scan
            is_active=True
        )
        db.add(new_pos)
