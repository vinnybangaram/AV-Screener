import sqlite3, os

db_path = 'screener.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    print('Tables:', tables)
    for t in tables:
        cursor.execute(f'PRAGMA table_info({t})')
        cols = [r[1] for r in cursor.fetchall()]
        print(f'  {t}: {cols}')
    conn.close()
else:
    print('screener.db not found')
