"""
app/services/alerts_scheduler.py

APScheduler configuration — all background jobs in one place.

Job schedule (all times IST = UTC+5:30):
┌─────────────────────────────────┬────────────────────┬────────────────────────────┐
│ Job                             │ IST                │ UTC (cron)                 │
├─────────────────────────────────┼────────────────────┼────────────────────────────┤
│ Hourly price snapshot           │ :05 past each hour │ min=5, h=3-10 (Mon-Fri)    │
│                                 │ 9:05-15:05 IST     │                            │
├─────────────────────────────────┼────────────────────┼────────────────────────────┤
│ Intraday watchlist auto-sync    │ 9:20 AM IST        │ 3:50 UTC Mon-Fri           │
├─────────────────────────────────┼────────────────────┼────────────────────────────┤
│ EOD OHLCV capture               │ 3:40 PM IST        │ 10:10 UTC Mon-Fri          │
├─────────────────────────────────┼────────────────────┼────────────────────────────┤
│ Alert scan (SL/Target hit)      │ Every 10 min       │ */10, h=3-10 (Mon-Fri)     │
└─────────────────────────────────┴────────────────────┴────────────────────────────┘
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron         import CronTrigger
import traceback


# ─────────────────────────────────────────────
# Job wrappers  (keep them thin — real logic
# lives in the service files)
# ─────────────────────────────────────────────

def _job_hourly_snapshot():
    """Capture price + P&L snapshot for every active position."""
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


def _job_intraday_sync():
    """
    Clear yesterday's intraday watchlist positions and add today's
    high-conviction intraday setups for all users.
    """
    try:
        from app.database           import SessionLocal
        from app.services.watchlist_service import auto_sync_intraday_radar
        db = SessionLocal()
        try:
            auto_sync_intraday_radar(db)
        finally:
            db.close()
    except Exception:
        traceback.print_exc()


def _job_alert_scan():
    """
    Check every active position for SL / Target breaches and
    create notifications when triggered.
    """
    try:
        from app.database import SessionLocal
        from app.models.watchlist  import WatchlistPosition
        from app.models.user       import User
        from app.services.watchlist_service import fetch_live_price
        from app.services          import notification_service

        db = SessionLocal()
        try:
            positions = (
                db.query(WatchlistPosition)
                  .filter(
                      WatchlistPosition.is_active == True,
                      WatchlistPosition.status    == "ACTIVE",
                  )
                  .all()
            )

            for pos in positions:
                price = fetch_live_price(pos.symbol)
                if price is None:
                    continue

                pos.latest_price = price

                # SL hit
                if pos.stop_loss and price <= pos.stop_loss:
                    pos.status = "SL_HIT"
                    notification_service.create_notification(
                        db       = db,
                        user_id  = pos.user_id,
                        message  = f"⚠️ Stop-loss hit for {pos.symbol} at ₹{price:.2f} (SL: ₹{pos.stop_loss:.2f})",
                        notif_type = "sl_hit",
                        priority = "high",
                        symbol   = pos.symbol,
                    )
                    print(f"[AlertScan] SL hit — {pos.symbol} @ {price}")

                # Target hit
                elif pos.target_price and price >= pos.target_price:
                    pos.status = "TARGET_HIT"
                    notification_service.create_notification(
                        db       = db,
                        user_id  = pos.user_id,
                        message  = f"🎯 Target reached for {pos.symbol} at ₹{price:.2f} (T: ₹{pos.target_price:.2f})",
                        notif_type = "target_hit",
                        priority = "high",
                        symbol   = pos.symbol,
                    )
                    print(f"[AlertScan] Target hit — {pos.symbol} @ {price}")

            db.commit()

        finally:
            db.close()

    except Exception:
        traceback.print_exc()


# ─────────────────────────────────────────────
# Scheduler setup
# ─────────────────────────────────────────────

scheduler = BackgroundScheduler(timezone="UTC")

# 1. Hourly price snapshots — :05 past the hour, 9:05 AM – 3:05 PM IST (3:35–9:35 UTC)
scheduler.add_job(
    _job_hourly_snapshot,
    CronTrigger(
        day_of_week = "mon-fri",
        hour        = "3-10",       # 3 AM – 10 AM UTC  ≈  8:30 AM – 3:30 PM IST
        minute      = "5",
    ),
    id            = "hourly_snapshot",
    name          = "Hourly Position Snapshot",
    replace_existing = True,
    misfire_grace_time = 120,
)

# 2. Intraday watchlist auto-sync — 9:20 AM IST = 3:50 AM UTC
scheduler.add_job(
    _job_intraday_sync,
    CronTrigger(
        day_of_week = "mon-fri",
        hour        = "3",
        minute      = "50",
    ),
    id            = "intraday_sync",
    name          = "Intraday Watchlist Auto-Sync",
    replace_existing = True,
    misfire_grace_time = 300,
)

# 3. EOD OHLCV fetch — 3:40 PM IST = 10:10 AM UTC
scheduler.add_job(
    _job_eod_ohlcv,
    CronTrigger(
        day_of_week = "mon-fri",
        hour        = "10",
        minute      = "10",
    ),
    id            = "eod_ohlcv",
    name          = "EOD OHLCV Capture",
    replace_existing = True,
    misfire_grace_time = 300,
)

# 4. EOD position snapshot — 3:35 PM IST = 10:05 AM UTC
scheduler.add_job(
    _job_eod_snapshot,
    CronTrigger(
        day_of_week = "mon-fri",
        hour        = "10",
        minute      = "5",
    ),
    id            = "eod_snapshot",
    name          = "EOD Position Snapshot",
    replace_existing = True,
    misfire_grace_time = 300,
)

# 5. Alert scan — every 10 minutes during market hours
scheduler.add_job(
    _job_alert_scan,
    CronTrigger(
        day_of_week = "mon-fri",
        hour        = "3-10",
        minute      = "*/10",
    ),
    id            = "alert_scan",
    name          = "SL/Target Alert Scan",
    replace_existing = True,
    misfire_grace_time = 60,
)
