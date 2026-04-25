from app.database import SessionLocal
from app.models.watchlist import WatchlistPosition
from app.services import market_service
from datetime import datetime

async def job_price_snapshot():
    """
    Fetch latest prices for all active watchlist items.
    """
    db = SessionLocal()
    try:
        active = db.query(WatchlistPosition).filter(WatchlistPosition.is_active == True).all()
        if not active:
            return
            
        symbols = list(set([p.symbol for p in active]))
        prices = await market_service.get_daily_changes(symbols)
        
        for p in active:
            price_data = prices.get(p.symbol)
            if price_data:
                p.latest_price = price_data["latest_price"]
                # Update PnL
                is_intraday = "intraday" in (p.category or "").lower()
                if is_intraday and (p.sub_type == "short" or p.side == "SHORT"):
                    p.latest_pnl = (p.entry_price - p.latest_price)
                else:
                    p.latest_pnl = (p.latest_price - p.entry_price)
                
                p.latest_pnl_percent = (p.latest_pnl / p.entry_price * 100) if p.entry_price > 0 else 0
                
        db.commit()
    except Exception as e:
        print(f"[Job] Price snapshot failed: {e}")
        db.rollback()
    finally:
        db.close()
