import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('screener.db')
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        new_columns = [
            ("google_id", "VARCHAR"),
            ("role", "VARCHAR DEFAULT 'user'"),
            ("last_login", "DATETIME"),
            ("plan", "VARCHAR DEFAULT 'free'")
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in columns:
                print(f"Adding '{col_name}' column to 'users' table...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                conn.commit()
                print(f"Added {col_name} successfully.")
            else:
                print(f"Column '{col_name}' already exists.")
                
        conn.close()
        print("Migration v2 completed.")
    except Exception as e:
        print(f"Migration v2 failed: {e}")

if __name__ == "__main__":
    migrate()
