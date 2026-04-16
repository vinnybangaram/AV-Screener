from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.watchlist import WatchlistPosition, PositionSnapshot
from app.services.watchlist_service import fetch_live_price
from datetime import datetime
import pandas as pd

def run_snapshot_job(interval_type: str = "hourly"):
    """
    Core engine to capture price snapshots for all active positions.
    Can be called by APScheduler or manual trigger.
    """
    db = SessionLocal()
    try:
        print(f"[SnapshotEngine] Starting {interval_type} snapshot at {datetime.utcnow().isoformat()}")
        
        # 1. Fetch all active positions
        positions = db.query(WatchlistPosition).filter(WatchlistPosition.is_active == True).all()
        if not positions:
            print("[SnapshotEngine] No active positions to track.")
            return

        # 2. Update their latest metrics
        for pos in positions:
            live_price = fetch_live_price(pos.symbol)
            if live_price is not None:
                entry_price = pos.entry_price or 0.0
                pnl = live_price - entry_price
                pnl_pct = (pnl / entry_price * 100) if entry_price > 0 else 0.0
                
                # Update position state
                pos.latest_price = live_price
                pos.latest_pnl = pnl
                pos.latest_pnl_percent = pnl_pct
                
                if pos.highest_price_seen is None or live_price > pos.highest_price_seen:
                    pos.highest_price_seen = live_price
                if pos.lowest_price_seen is None or live_price < pos.lowest_price_seen:
                    pos.lowest_price_seen = live_price
                
                # Create snapshot record
                snapshot = PositionSnapshot(
                    position_id=pos.id,
                    user_id=pos.user_id,
                    symbol=pos.symbol,
                    price=live_price,
                    pnl=pnl,
                    pnl_percent=pnl_pct,
                    interval_type=interval_type,
                    captured_at=datetime.utcnow()
                )
                db.add(snapshot)
        
        db.commit()
        print(f"[SnapshotEngine] Successfully captured snapshots for {len(positions)} positions.")
        
    except Exception as e:
        print(f"[SnapshotEngine] Critical error: {e}")
        db.rollback()
    finally:
        db.close()

def get_performance_trend(db: Session, user_id: int, category: str = "All", timeframe: str = "This Month"):
    """
    Aggregates historical snapshots to power the Dashboard Chart.
    """
    # 1. Base query for snapshots
    query = db.query(PositionSnapshot).filter(PositionSnapshot.user_id == user_id)
    
    # 2. Filter by category if not 'All'
    if category != "All":
        cat_map = {
            "Penny Stocks": "Penny",
            "Multibaggers": "Multibagger"
        }
        target_cat = cat_map.get(category, category)
        from sqlalchemy import or_
        query = query.join(WatchlistPosition).filter(
            or_(
                WatchlistPosition.category.ilike(f"%{target_cat}%"),
                WatchlistPosition.category.ilike(f"{target_cat}%"),
                WatchlistPosition.category == target_cat
            )
        )
    
    # 3. Timeframe filtering
    now = datetime.utcnow()
    if timeframe == "Today":
        start_date = datetime(now.year, now.month, now.day)
    elif timeframe == "This Week":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) # simplified
    elif timeframe == "This Month":
        start_date = datetime(now.year, now.month, 1)
    else: # This Year
        start_date = datetime(now.year, 1, 1)
        
    query = query.filter(PositionSnapshot.captured_at >= start_date)
    
    snapshots = query.order_by(PositionSnapshot.captured_at.asc()).all()
    if not snapshots:
        return {"labels": [], "datasets": []}

    # Format for Chart.js/Recharts
    # We group by timestamp and sum up P/L for a 'Combined Portfolio' view
    data_points = {} # timestamp -> {pnl: sum, pnl_pct: avg}
    
    for s in snapshots:
        # Normalize timestamp to hour or day depending on timeframe
        if timeframe == "Today":
            ts = s.captured_at.strftime("%H:00")
        else:
            ts = s.captured_at.strftime("%d %b")
            
        if ts not in data_points:
            data_points[ts] = {"pnl": 0.0, "pnl_pct": 0.0, "count": 0}
            
        data_points[ts]["pnl"] += s.pnl
        data_points[ts]["pnl_pct"] += s.pnl_percent
        data_points[ts]["count"] += 1

    labels = list(data_points.keys())
    pnl_values = [round(d["pnl"], 2) for d in data_points.values()]
    pct_values = [round(d["pnl_pct"] / d["count"], 2) if d["count"] > 0 else 0 for d in data_points.values()]

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Total P/L (₹)",
                "data": pnl_values,
                "borderColor": "#6366f1",
                "backgroundColor": "rgba(99, 102, 241, 0.1)",
                "fill": True
            },
            {
                "label": "Avg Return (%)",
                "data": pct_values,
                "borderColor": "#22c55e",
                "backgroundColor": "rgba(34, 197, 94, 0.1)",
                "fill": True
            }
        ]
    }
