from app.database import engine
from sqlalchemy import text

def migrate():
    print("Migrating database for Triple-Stage TSL Matrix...")
    with engine.connect() as conn:
        try:
            # Add TSL hit tracking columns
            conn.execute(text("ALTER TABLE option_trades ADD COLUMN tsl_1_hit BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE option_trades ADD COLUMN tsl_2_hit BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE option_trades ADD COLUMN tsl_3_hit BOOLEAN DEFAULT 0"))
            conn.commit()
            print("Successfully added TSL hit columns.")
        except Exception as e:
            print(f"Columns might already exist: {e}")

if __name__ == "__main__":
    migrate()
