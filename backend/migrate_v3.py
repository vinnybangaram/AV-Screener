import sqlite3

def run_migration():
    conn = sqlite3.connect('screener.db')
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(users)")
    cols = {row[1] for row in cur.fetchall()}
    
    needed = [
        ("hashed_password", "TEXT"),
        ("is_verified", "BOOLEAN DEFAULT 0"),
        ("verification_token", "TEXT")
    ]

    for col, col_type in needed:
        if col not in cols:
            print(f"Adding column {col}...")
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        else:
            print(f"Column {col} already exists.")

    conn.commit()
    conn.close()
    print("Migration V3 successful.")

if __name__ == "__main__":
    run_migration()
