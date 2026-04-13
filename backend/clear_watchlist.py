import sqlite3
import os

def clear_watchlist_for_user(email: str):
    db_path = 'screener.db'
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Get user_id for the email
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User with email '{email}' not found.")
            return
        
        user_id = user[0]
        print(f"Found user_id {user_id} for email {email}.")

        # 2. Delete from watchlists
        cursor.execute("DELETE FROM watchlists WHERE user_id = ?", (user_id,))
        rows_deleted = cursor.rowcount
        conn.commit()
        
        print(f"Successfully deleted {rows_deleted} watchlist records for user '{email}'.")
        
        conn.close()
    except Exception as e:
        print(f"Operation failed: {e}")

if __name__ == "__main__":
    clear_watchlist_for_user("vinny009@gmail.com")
