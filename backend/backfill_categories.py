import sqlite3
import os

db_path = 'backend/screener.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Map common sources to categories
updates = [
    ("UPDATE watchlist_positions SET category = 'Penny' WHERE (source_module LIKE '%Penny%') AND (category = 'Manual' OR category IS NULL OR category = '')"),
    ("UPDATE watchlist_positions SET category = 'Multibagger' WHERE (source_module LIKE '%Multibagger%') AND (category = 'Manual' OR category IS NULL OR category = '')"),
    ("UPDATE watchlist_positions SET category = 'Intraday' WHERE (source_module LIKE '%Intraday%') AND (category = 'Manual' OR category IS NULL OR category = '')")
]

total_rows = 0
for sql in updates:
    cur.execute(sql)
    total_rows += cur.rowcount

conn.commit()
print(f"Successfully backfilled categories for {total_rows} positions.")
conn.close()
