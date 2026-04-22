from app.database import SessionLocal
from app.models.watchlist import WatchlistPosition
from app.models.intraday_history import IntradayHistory
from app.services import market_service
from datetime import datetime
import asyncio

async def job_cleanup_expired():
    """
    Remove expired intraday picks and save them to history.
    """
    print(f"[Job] Starting Cleanup at {datetime.now()}")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        expired = db.query(WatchlistPosition).filter(
            WatchlistPosition.category.ilike("%intraday%"),
            WatchlistPosition.expires_at <= now,
            WatchlistPosition.is_active == True
        ).all()
        
        if not expired:
            print("[Job] No expired picks to clean.")
            return

        symbols = list(set([p.symbol for p in expired]))
        prices = await market_service.get_daily_changes(symbols)
        
        for p in expired:
            price_data = prices.get(p.symbol, {})
            last_price = price_data.get("latest_price", p.latest_price)
            
            pnl = 0
            if last_price:
                if p.sub_type == "short" or p.side == "SHORT":
                    pnl = (p.entry_price - last_price) * p.quantity
                else:
                    pnl = (last_price - p.entry_price) * p.quantity
            
            history = IntradayHistory(
                symbol=p.symbol,
                side=p.sub_type,
                entry_price=p.entry_price,
                exit_price=last_price,
                pnl=pnl,
                pnl_percent=(pnl / (p.entry_price * p.quantity) * 100) if p.entry_price > 0 else 0,
                date=p.added_at.date(),
                added_at=p.added_at,
                closed_at=now
            )
            db.add(history)
            
            p.is_active = False
            p.removed_at = now
            
        db.commit()
        print(f"[Job] Cleaned up {len(expired)} picks.")
    except Exception as e:
        print(f"[Job] Cleanup failed: {e}")
        db.rollback()
    finally:
        db.close()
