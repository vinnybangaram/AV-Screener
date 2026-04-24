
from app.database import engine
from sqlalchemy import text

def force_close():
    with engine.connect() as conn:
        # Use simple string literal since we don't want to import datetime for SQL
        sql = text("UPDATE option_trades SET status='CLOSED', exit_reason='MANUAL_FORCE_CLOSE', exit_time=CURRENT_TIMESTAMP, exit_price=entry_price WHERE status='OPEN'")
        res = conn.execute(sql)
        conn.commit()
        print(f"Force closed {res.rowcount} trades.")

if __name__ == "__main__":
    force_close()
