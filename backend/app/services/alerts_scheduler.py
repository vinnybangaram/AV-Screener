"""
app/services/alerts_scheduler.py

APScheduler configuration — all background jobs in one place.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron         import CronTrigger
from apscheduler.triggers.interval     import IntervalTrigger
import traceback
import asyncio
from app.database import SessionLocal

# ─────────────────────────────────────────────
# Job wrappers
# ─────────────────────────────────────────────

def _job_intraday_scan_workflow():
    """
    Cleans up expired intraday picks and triggers a fresh scan.
    Runs at 9:15 AM IST (3:45 AM UTC).
    """
    try:
        from app.jobs.cleanup_expired import job_cleanup_expired
        from app.jobs.daily_intraday_scan import job_daily_intraday_scan
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
            
        # 1. Cleanup old ones
        loop.run_until_complete(job_cleanup_expired())
        # 2. Run fresh scan
        loop.run_until_complete(job_daily_intraday_scan())
        loop.close()
        
        print("[Scheduler] Intraday Scan Workflow complete.")
    except Exception:
        traceback.print_exc()

def _job_price_snapshot_sync():
    """5-min price snapshot for real-time dashboard PnL."""
    try:
        from app.jobs.price_snapshot import job_price_snapshot
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(job_price_snapshot())
        loop.close()
    except Exception:
        traceback.print_exc()

def _job_cache_rebuild_sync():
    """Periodic background rebuild of the dashboard cache."""
    try:
        from app.jobs.rebuild_dashboard_cache import job_rebuild_dashboard_cache
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(job_rebuild_dashboard_cache())
        loop.close()
    except Exception:
        traceback.print_exc()

def _job_hourly_snapshot():
    """Capture price + P&L snapshot for every active position (historical tracking)."""
    try:
        from app.services.snapshot_service import run_snapshot_job
        run_snapshot_job(interval_type="hourly")
    except Exception:
        traceback.print_exc()

def _job_eod_snapshot():
    """End-of-day snapshot — tagged 'eod' for separate trend queries."""
    try:
        from app.services.snapshot_service import run_snapshot_job
        run_snapshot_job(interval_type="eod")
    except Exception:
        traceback.print_exc()

def _job_eod_ohlcv():
    """Fetch and store today's OHLCV candle for every tracked symbol."""
    try:
        from app.services.daily_data_service import fetch_and_store_eod
        fetch_and_store_eod()
    except Exception:
        traceback.print_exc()

def _job_alert_scan():
    """Check active positions for SL / Target breaches."""
    try:
        from app.models.watchlist  import WatchlistPosition
        from app.services.watchlist_service import fetch_live_price
        from app.services          import notification_service

        db = SessionLocal()
        try:
            positions = db.query(WatchlistPosition).filter(
                WatchlistPosition.is_active == True,
                WatchlistPosition.status == "ACTIVE"
            ).all()

            for pos in positions:
                price = fetch_live_price(pos.symbol)
                if price is None: continue
                pos.latest_price = price

                if pos.stop_loss and ((pos.side == "LONG" and price <= pos.stop_loss) or (pos.side == "SHORT" and price >= pos.stop_loss)):
                    pos.status = "SL_HIT"
                    notification_service.create_notification(
                        db=db, user_id=pos.user_id,
                        message=f"⚠️ Stop-loss hit for {pos.symbol} at ₹{price:.2f}",
                        notif_type="sl_hit", priority="high", symbol=pos.symbol
                    )
                elif pos.target_price and ((pos.side == "LONG" and price >= pos.target_price) or (pos.side == "SHORT" and price <= pos.target_price)):
                    pos.status = "TARGET_HIT"
                    notification_service.create_notification(
                        db=db, user_id=pos.user_id,
                        message=f"🎯 Target reached for {pos.symbol} at ₹{price:.2f}",
                        notif_type="target_hit", priority="high", symbol=pos.symbol
                    )
            db.commit()
        finally:
            db.close()
    except Exception:
        traceback.print_exc()

def _job_market_regime():
    try:
        from app.services.regime_service import calculate_current_regime
        db = SessionLocal()
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(calculate_current_regime(db))
            loop.close()
        finally:
            db.close()
    except Exception:
        traceback.print_exc()

def _job_option_signals():
    try:
        from app.services.option_signals_service import run_option_signals_job
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run_option_signals_job())
        loop.close()
    except Exception:
        traceback.print_exc()

# ─────────────────────────────────────────────
# Scheduler setup
# ─────────────────────────────────────────────

scheduler = BackgroundScheduler(timezone="UTC")

# 1. 5-Min Price Snapshots (Market Hours)
scheduler.add_job(
    _job_price_snapshot_sync,
    CronTrigger(day_of_week="mon-fri", hour="3-10", minute="*/5"),
    id="price_snapshot_5min", replace_existing=True
)

# 2. Daily Intraday Scan & Cleanup — 9:15 AM IST (3:45 AM UTC)
scheduler.add_job(
    _job_intraday_scan_workflow,
    CronTrigger(day_of_week="mon-fri", hour="3", minute="45"),
    id="intraday_scan_workflow", replace_existing=True
)

# 3. EOD OHLCV capture — 3:40 PM IST (10:10 AM UTC)
scheduler.add_job(
    _job_eod_ohlcv,
    CronTrigger(day_of_week="mon-fri", hour="10", minute="10"),
    id="eod_ohlcv", replace_existing=True
)

# 4. EOD position snapshot — 3:35 PM IST (10:05 AM UTC)
scheduler.add_job(
    _job_eod_snapshot,
    CronTrigger(day_of_week="mon-fri", hour="10", minute="5"),
    id="eod_snapshot", replace_existing=True
)

# 5. Alert scan — every 10 minutes
scheduler.add_job(
    _job_alert_scan,
    CronTrigger(day_of_week="mon-fri", hour="3-10", minute="*/10"),
    id="alert_scan", replace_existing=True
)

# 6. Market Regime Snapshot — every 15 minutes
scheduler.add_job(
    _job_market_regime,
    CronTrigger(day_of_week="mon-fri", hour="3-10", minute="*/15"),
    id="market_regime_snapshot", replace_existing=True
)

# 7. Dashboard Cache Rebuild — Every 10 minutes
scheduler.add_job(
    _job_cache_rebuild_sync,
    IntervalTrigger(minutes=10),
    id="dashboard_cache_rebuild", replace_existing=True
)

# 8. Option Signals Engine — every 10 seconds
scheduler.add_job(
    _job_option_signals,
    IntervalTrigger(seconds=10),
    id="option_signals_engine", replace_existing=True
)
