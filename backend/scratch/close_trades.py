
from app.database import SessionLocal, Base
from app.models.option_signal import OptionTrade
from app.models.user import User # Import to resolve foreign key
from datetime import datetime

def close_open_trades():
    db = SessionLocal()
    try:
        trades = db.query(OptionTrade).filter(OptionTrade.status == 'OPEN').all()
        print(f"Found {len(trades)} open trades to close.")
        
        for t in trades:
            print(f"Closing trade {t.id} - {t.instrument}")
            t.status = 'CLOSED'
            t.exit_reason = 'FORCE_CLOSE_MARKET_EOD'
            t.exit_time = datetime.utcnow()
            # If exit price is not set, use entry price as fallback for P&L 0
            if not t.exit_price:
                t.exit_price = t.entry_price
            
            # Recalculate P&L if necessary
            lot_size = 65 if t.symbol == "NIFTY" else 15
            pnl_pts = t.exit_price - t.entry_price
            t.pnl = round((t.realized_partial_pnl or 0.0) + (pnl_pts * lot_size * (t.lots * (t.active_multiplier or 1.0))), 2)
            t.pnl_pct = round((pnl_pts / t.entry_price) * 100, 2) if t.entry_price else 0
            
        db.commit()
        print(f"Successfully closed {len(trades)} trades.")
    except Exception as e:
        print(f"Error closing trades: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    close_open_trades()
