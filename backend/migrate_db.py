"""
Local SQLite migration: add missing columns to users table
to match current SQLAlchemy model definition.
Run once: python migrate_db.py
"""
import sqlite3

conn = sqlite3.connect('screener.db')
cur = conn.cursor()

# Get existing columns
cur.execute("PRAGMA table_info(users)")
existing_cols = {row[1] for row in cur.fetchall()}
print(f"Existing columns: {existing_cols}")

migrations = []

if 'avatar_url' not in existing_cols:
    migrations.append("ALTER TABLE users ADD COLUMN avatar_url TEXT")

if 'login_count' not in existing_cols:
    migrations.append("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 1")

if 'is_active' not in existing_cols:
    migrations.append("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")

# Handle last_login → last_login_at rename
# SQLite 3.25+ supports RENAME COLUMN; older versions need a workaround
if 'last_login_at' not in existing_cols and 'last_login' in existing_cols:
    # Add new column and copy data
    migrations.append("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
    # We'll copy data separately after adding the column

for sql in migrations:
    try:
        print(f"Running: {sql}")
        cur.execute(sql)
    except Exception as e:
        print(f"  Skipped (already exists?): {e}")

# Copy last_login → last_login_at
cur.execute("PRAGMA table_info(users)")
updated_cols = {row[1] for row in cur.fetchall()}
if 'last_login_at' in updated_cols and 'last_login' in updated_cols:
    print("Copying last_login → last_login_at ...")
    cur.execute("UPDATE users SET last_login_at = last_login WHERE last_login_at IS NULL")

conn.commit()
conn.close()

print("\n✅ Migration complete. Verify:")
conn2 = sqlite3.connect('screener.db')
cur2 = conn2.cursor()
cur2.execute("PRAGMA table_info(users)")
cols = [r[1] for r in cur2.fetchall()]
print(f"  users columns: {cols}")
conn2.close()
