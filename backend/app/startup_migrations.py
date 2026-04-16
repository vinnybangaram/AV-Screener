"""
Startup migration: safely add missing columns to existing tables.
Uses IF NOT EXISTS (PostgreSQL) / PRAGMA (SQLite) for idempotent execution.
Runs automatically on every app startup — safe to run repeatedly.
"""
import os
from sqlalchemy import text
from app.database import engine


def _is_postgres() -> bool:
    try:
        db_url = str(engine.url)
        return "postgresql" in db_url or "postgres" in db_url
    except:
        return False


def run_migrations():
    """
    Idempotent column migrations.
    PostgreSQL: uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
    SQLite: checks PRAGMA table_info before adding
    """
    is_pg = _is_postgres()
    print(f"[Migration] Running startup migrations (DB: {'PostgreSQL' if is_pg else 'SQLite'})...")

    with engine.connect() as conn:

        # ── Users table ──
        if is_pg:
            # PostgreSQL: IF NOT EXISTS is supported
            migrations = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 1;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';",
            ]
            for sql in migrations:
                try:
                    conn.execute(text(sql))
                    print(f"  [Migration] OK: {sql.strip()}")
                except Exception as e:
                    print(f"  [Migration] Skipped (may already exist): {e}")

        else:
            # SQLite: check PRAGMA table_info
            result = conn.execute(text("PRAGMA table_info(users)"))
            existing_cols = {row[1] for row in result.fetchall()}

            sqlite_migrations = []
            if 'avatar_url' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN avatar_url TEXT;")
            if 'login_count' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 1;")
            if 'is_active' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;")
            if 'last_login_at' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN last_login_at DATETIME;")
            if 'google_id' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN google_id TEXT;")
            if 'role' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';")
            if 'plan' not in existing_cols:
                sqlite_migrations.append("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';")

            for sql in sqlite_migrations:
                try:
                    conn.execute(text(sql))
                    print(f"  [Migration] OK: {sql.strip()}")
                except Exception as e:
                    print(f"  [Migration] Skipped: {e}")

        # ── Watchlist Migration Logic ──
        # Check if legacy table exists
        try:
            if is_pg:
                res = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'watchlist_positions');"))
                has_legacy = res.scalar()
            else:
                res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='watchlist_positions';"))
                has_legacy = res.fetchone() is not None

            if has_legacy:
                # Check if we need to migrate (new table is empty but old has data)
                new_count = conn.execute(text("SELECT count(*) FROM watchlists;")).scalar()
                old_count = conn.execute(text("SELECT count(*) FROM watchlist_positions;")).scalar()
                
                if new_count == 0 and old_count > 0:
                    print(f"[Migration] Found {old_count} legacy positions. Migrating to new 'watchlists' table...")
                    
                    # Migration query mapping columns
                    # old: [id, user_id, symbol, company_name, category, source_module, added_at, entry_price, ...]
                    # new: [id, user_id, symbol, added_price, added_date, source, status, stop_loss, target_price, updated_at]
                    
                    migrate_sql = """
                    INSERT INTO watchlists (user_id, symbol, added_price, added_date, source, status, stop_loss, target_price, updated_at)
                    SELECT user_id, symbol, entry_price, added_at, category, status, stop_loss, target_price, updated_at
                    FROM watchlist_positions;
                    """
                    conn.execute(text(migrate_sql))
                    print(f"[Migration] Successfully migrated {old_count} items.")
        except Exception as e:
            print(f"[Migration] Watchlist data migration skipped: {e}")

        conn.commit()

    print("[Migration] Startup migrations complete.")
