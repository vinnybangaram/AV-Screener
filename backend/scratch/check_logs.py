import asyncio
from app.services.option_signals_service import option_signals_service
from app.database import SessionLocal

async def check_dashboard():
    db = SessionLocal()
    try:
        summary = await option_signals_service.get_dashboard_summary(db, user_id=1)
        print(f"Status: {summary.engine_status}")
        print(f"Signal Status: {summary.signal_status}")
        print(f"Active Trades: {summary.active_trades_count}")
        print(f"Signals Today: {summary.signals_today}")
        print("\nLogs:")
        for log in summary.engine_logs:
            print(log)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_dashboard())
