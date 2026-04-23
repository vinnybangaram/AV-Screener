from app.database import engine
from sqlalchemy import text

def migrate():
    print("Checking for missing columns in option_trades...")
    with engine.connect() as conn:
        try:
            # Check if lots column exists
            conn.execute(text("SELECT lots FROM option_trades LIMIT 1"))
            print("Column 'lots' already exists.")
        except Exception:
            print("Adding column 'lots' to option_trades...")
            try:
                conn.execute(text("ALTER TABLE option_trades ADD COLUMN lots INTEGER DEFAULT 1"))
                conn.commit()
                print("Successfully added 'lots' column.")
            except Exception as e:
                print(f"Failed to add column: {e}")

if __name__ == "__main__":
    migrate()
