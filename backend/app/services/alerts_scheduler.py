import threading
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.alerts_engine import engine as alerts_engine
from app.models.user import User

from app.services.snapshot_service import run_snapshot_job
from datetime import datetime

class AlertsScheduler:
    """
    Background worker that triggers the alerts engine and captures snapshots.
    """

    def __init__(self, interval_seconds: int = 300): # Default 5 mins
        self.interval = interval_seconds
        self.is_running = False
        self._thread = None
        self._last_snapshot_hour = -1
        self._last_eod_day = -1
        self._last_intraday_sync_day = -1

    def start(self):
        if self.is_running: return
        self.is_running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print(f"[Scheduler] Portfolio Intelligence & Alert monitoring started")

    def _run_loop(self):
        while self.is_running:
            try:
                db = SessionLocal()
                now = datetime.utcnow()
                
                # ── 1. ALERTS ENGINE ──
                users = db.query(User).all()
                for user in users:
                    alerts_engine.process_user_alerts(db, user.id)
                db.close()
                
                # ── 2. SNAPSHOT ENGINE ──
                # Hourly Snapshot (only if hour changed)
                if now.hour != self._last_snapshot_hour:
                    print(f"[Scheduler] Triggering hourly snapshot sequence...")
                    run_snapshot_job(interval_type="hourly")
                    self._last_snapshot_hour = now.hour
                
                # EOD Snapshot (around 4 PM IST = 10:30 AM UTC)
                # If market is closed and we haven't done EOD for today
                if now.hour >= 11 and now.day != self._last_eod_day:
                    print(f"[Scheduler] Triggering EOD snapshot sequence...")
                    run_snapshot_job(interval_type="eod")
                    self._last_eod_day = now.day

                # ── 3. INTRADAY AUTO-SYNC (9:15 AM - 9:30 AM IST / 3:45 AM - 4:00 AM UTC) ──
                if now.hour == 3 and now.minute >= 45 and now.day != self._last_intraday_sync_day:
                    from app.services.watchlist_service import auto_sync_intraday_radar
                    print(f"[Scheduler] Triggering Daily Intraday Auto-Sync...")
                    auto_sync_intraday_radar(db)
                    self._last_intraday_sync_day = now.day

            except Exception as e:
                print(f"[Scheduler] Critical Error: {e}")
            finally:
                db.close()
            
            time.sleep(self.interval)

    def stop(self):
        self.is_running = False

scheduler = AlertsScheduler()
