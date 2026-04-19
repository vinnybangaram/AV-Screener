import sqlite3
import os

def migrate():
    db_path = 'screener.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add 'side' to watchlist_positions
    try:
        cursor.execute("ALTER TABLE watchlist_positions ADD COLUMN side VARCHAR DEFAULT 'LONG'")
        print("Success: Added 'side' column to watchlist_positions")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'side' already exists in watchlist_positions")
        else:
            print(f"Error adding 'side' to watchlist_positions: {e}")

    # 2. Add 'side' to position_snapshots
    try:
        cursor.execute("ALTER TABLE position_snapshots ADD COLUMN side VARCHAR DEFAULT 'LONG'")
        print("Success: Added 'side' column to position_snapshots")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'side' already exists in position_snapshots")
        else:
            print(f"Error adding 'side' to position_snapshots: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
