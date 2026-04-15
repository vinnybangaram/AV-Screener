"""
Startup migration: safely add missing columns to existing tables.
Uses IF NOT EXISTS (PostgreSQL) / PRAGMA (SQLite) for idempotent execution.
Runs automatically on every app startup — safe to run repeatedly.
"""
import os
from sqlalchemy import text
from app.database import engine


def _is_postgres() -> bool:
    db_url = str(engine.url)
    return "postgresql" in db_url or "postgres" in db_url


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

            for sql in sqlite_migrations:
                try:
                    conn.execute(text(sql))
                    print(f"  [Migration] OK: {sql.strip()}")
                except Exception as e:
                    print(f"  [Migration] Skipped: {e}")

        conn.commit()

    print("[Migration] Startup migrations complete.")
