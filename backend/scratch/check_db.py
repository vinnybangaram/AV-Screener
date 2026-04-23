from app.database import SessionLocal
from app.models.option_signal import OptionSettings, OptionTrade
from datetime import datetime

db = SessionLocal()
try:
    settings = db.query(OptionSettings).all()
    print(f"Total settings found: {len(settings)}")
    for s in settings:
        print(f"User ID: {s.user_id}, Auto Execute: {s.auto_execute}, Max Trades: {s.max_trades_day}")
    
    trades = db.query(OptionTrade).filter(OptionTrade.execution_time >= datetime.utcnow().replace(hour=0, minute=0, second=0)).all()
    print(f"Total trades today: {len(trades)}")
    for t in trades:
        print(f"Trade: {t.symbol} {t.type} @ {t.entry_price}, Status: {t.status}")
finally:
    db.close()
