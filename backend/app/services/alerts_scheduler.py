import threading
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.alerts_engine import engine as alerts_engine
from app.models.user import User

class AlertsScheduler:
    """
    Background worker that triggers the alerts engine for all active users.
    """

    def __init__(self, interval_seconds: int = 300): # Default 5 mins
        self.interval = interval_seconds
        self.is_running = False
        self._thread = None

    def start(self):
        if self.is_running: return
        self.is_running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print(f"[Scheduler] Alert monitoring started (Interval: {self.interval}s)")

    def _run_loop(self):
        while self.is_running:
            try:
                db = SessionLocal()
                # 1. Fetch all users (or active ones)
                users = db.query(User).all()
                for user in users:
                    alerts_engine.process_user_alerts(db, user.id)
                db.close()
            except Exception as e:
                print(f"[Scheduler] Critical Error: {e}")
            
            time.sleep(self.interval)

    def stop(self):
        self.is_running = False

scheduler = AlertsScheduler()
