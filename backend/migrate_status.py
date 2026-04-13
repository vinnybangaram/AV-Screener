import sqlite3
import os

def migrate_watchlist_status():
    db_path = 'screener.db'
    if not os.path.exists(db_path):
        print("Database sreeener.db not found. Skipping migration.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='watchlists'")
        if not cursor.fetchone():
            print("Table 'watchlists' does not exist yet.")
            return

        # Check if column exists
        cursor.execute("PRAGMA table_info(watchlists)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'status' not in columns:
            print("Adding 'status' column to 'watchlists' table...")
            cursor.execute("ALTER TABLE watchlists ADD COLUMN status VARCHAR DEFAULT 'ACTIVE'")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'status' already exists. No migration needed.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_watchlist_status()
