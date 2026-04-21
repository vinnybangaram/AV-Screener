import sys
import os

# Add parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Checking OptionTrade table...")
        # Add columns to option_trades
        cols = [
            ("partial_booked", "BOOLEAN DEFAULT 0"),
            ("trailing_sl", "FLOAT"),
            ("active_multiplier", "FLOAT DEFAULT 1.0"),
            ("realized_partial_pnl", "FLOAT DEFAULT 0.0")
        ]
        for col_name, col_type in cols:
            try:
                conn.execute(text(f"ALTER TABLE option_trades ADD COLUMN {col_name} {col_type}"))
                print(f"Added {col_name} to option_trades")
            except Exception as e:
                print(f"Column {col_name} might already exist or error: {e}")

        print("Checking OptionSettings table...")
        # Add columns to option_settings
        cols_settings = [
            ("whatsapp_alerts", "BOOLEAN DEFAULT 0"),
            ("phone_number", "VARCHAR")
        ]
        for col_name, col_type in cols_settings:
            try:
                conn.execute(text(f"ALTER TABLE option_settings ADD COLUMN {col_name} {col_type}"))
                print(f"Added {col_name} to option_settings")
            except Exception as e:
                print(f"Column {col_name} might already exist or error: {e}")
        
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
