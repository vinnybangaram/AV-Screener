import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('screener.db')
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
        if not cursor.fetchone():
            print("Table 'notifications' does not exist yet. It will be created on startup.")
            return

        # Check if column exists
        cursor.execute("PRAGMA table_info(notifications)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'priority' not in columns:
            print("Adding 'priority' column to 'notifications' table...")
            cursor.execute("ALTER TABLE notifications ADD COLUMN priority VARCHAR DEFAULT 'LOW'")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'priority' already exists. No migration needed.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
