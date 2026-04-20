from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.watchlist import WatchlistPosition, PositionSnapshot
from app.services import market_service
from datetime import datetime
import asyncio

def run_snapshot_job(interval_type: str = "hourly"):
    """
    Core engine to capture price snapshots for all active positions.
    Optimized for batch processing.
    """
    db = SessionLocal()
    try:
        print(f"[SnapshotEngine] Starting {interval_type} snapshot at {datetime.utcnow().isoformat()}")
        
        # 1. Fetch all active positions
        positions = db.query(WatchlistPosition).filter(WatchlistPosition.is_active == True).all()
        if not positions:
            print("[SnapshotEngine] No active positions to track.")
            return

        # 2. Batch fetch live prices
        symbols = list(set(pos.symbol for pos in positions))
        # Use existing async market service in a thread safe way
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        live_data = loop.run_until_complete(market_service.get_daily_changes(symbols))
        loop.close()

        # 3. Update positions and create snapshots
        snapshot_count = 0
        for pos in positions:
            data = live_data.get(pos.symbol)
            if data:
                live_price = data["latest_price"]
                entry_price = pos.entry_price or 0.0
                pnl = live_price - entry_price if pos.side != "SHORT" else entry_price - live_price
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
                    captured_at=datetime.utcnow(),
                    side=pos.side
                )
                db.add(snapshot)
                snapshot_count += 1
        
        db.commit()
        print(f"[SnapshotEngine] Successfully captured {snapshot_count} snapshots.")
        
    except Exception as e:
        print(f"[SnapshotEngine] Critical error: {e}")
        db.rollback()
    finally:
        db.close()

def get_performance_trend(db: Session, user_id: int, category: str = "All", timeframe: str = "This Month"):
    """
    Aggregates historical snapshots to power the Dashboard Chart.
    Optimized for large data sets.
    """
    # 1. Base query for snapshots
    query = db.query(PositionSnapshot).filter(PositionSnapshot.user_id == user_id)
    
    # 2. Filter by category
    if category != "All":
        cat_map = {
            "Penny Stocks": "penny", "Multibaggers": "multibagger", "Intraday Radar": "intraday",
            "Intraday Longs": "intraday_long", "Intraday Shorts": "intraday_short", "Core Portfolio": "core"
        }
        target_cat = cat_map.get(category, category).lower()
        query = query.join(WatchlistPosition)
        
        if target_cat == 'intraday_long':
            query = query.filter(WatchlistPosition.category.ilike("%intraday%"), WatchlistPosition.side != "SHORT")
        elif target_cat == 'intraday_short':
            query = query.filter(WatchlistPosition.category.ilike("%intraday%"), WatchlistPosition.side == "SHORT")
        elif target_cat == 'core':
            from sqlalchemy import or_
            query = query.filter(or_(WatchlistPosition.category.ilike("%core%"), WatchlistPosition.category.ilike("%investment%"), WatchlistPosition.category.ilike("%manual%")))
        else:
            query = query.filter(WatchlistPosition.category.ilike(f"%{target_cat}%"))
    
    # 3. Timeframe filtering
    now = datetime.utcnow()
    if timeframe == "Today":
        start_date = datetime(entry.year, entry.month, entry.day) if (entry := now) else now # mock
        start_date = datetime(now.year, now.month, now.day)
    elif timeframe == "This Week":
        start_date = now - timedelta(days=now.weekday())
    elif timeframe == "This Month":
        start_date = datetime(now.year, now.month, 1)
    else: # This Year
        start_date = datetime(now.year, 1, 1)
        
    query = query.filter(PositionSnapshot.captured_at >= start_date)
    
    # Use only necessary columns to reduce memory
    snapshots = query.with_entities(PositionSnapshot.pnl, PositionSnapshot.pnl_percent, PositionSnapshot.captured_at)\
                     .order_by(PositionSnapshot.captured_at.asc()).all()
                     
    if not snapshots:
        return {"labels": [], "datasets": []}

    data_points = {} 
    
    for pnl, pnl_pct, captured_at in snapshots:
        ts = captured_at.strftime("%H:00") if timeframe == "Today" else captured_at.strftime("%d %b")
            
        if ts not in data_points:
            data_points[ts] = {"pnl": 0.0, "pnl_pct": 0.0, "count": 0}
            
        data_points[ts]["pnl"] += pnl
        data_points[ts]["pnl_pct"] += pnl_pct
        data_points[ts]["count"] += 1

    labels = list(data_points.keys())
    pnl_values = [round(d["pnl"], 2) for d in data_points.values()]
    pct_values = [round(d["pnl_pct"] / d["count"], 2) if d["count"] > 0 else 0 for d in data_points.values()]

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Total P/L (₹)", "data": pnl_values, "borderColor": "#6366f1", 
                "backgroundColor": "rgba(99, 102, 241, 0.1)", "fill": True
            },
            {
                "label": "Avg Return (%)", "data": pct_values, "borderColor": "#22c55e", 
                "backgroundColor": "rgba(34, 197, 94, 0.1)", "fill": True
            }
        ]
    }
