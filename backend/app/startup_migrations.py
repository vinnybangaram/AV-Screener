"""
app/startup_migrations.py

Idempotent column / table migrations that run at startup BEFORE
Base.metadata.create_all().  Add new entries here whenever a model
gains a new column that needs to exist on already-deployed databases.
"""

from app.database import engine
from sqlalchemy import text, inspect
import traceback


def _column_exists(conn, table: str, column: str) -> bool:
    insp = inspect(conn)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def _table_exists(conn, table: str) -> bool:
    insp = inspect(conn)
    return table in insp.get_table_names()


def run_migrations():
    print("[Migrations] Running startup migrations…")

    with engine.connect() as conn:
        try:
            # ── watchlist_positions ──────────────────────────────────────────
            if _table_exists(conn, "watchlist_positions"):

                additions = [
                    ("company_name",        "VARCHAR"),
                    ("latest_price",        "FLOAT"),
                    ("latest_pnl",          "FLOAT"),
                    ("latest_pnl_percent",  "FLOAT"),
                    ("highest_price_seen",  "FLOAT"),
                    ("lowest_price_seen",   "FLOAT"),
                    ("status",              "VARCHAR DEFAULT 'ACTIVE'"),
                    ("stop_loss",           "FLOAT"),
                    ("target_price",        "FLOAT"),
                    ("updated_at",          "DATETIME"),
                    ("removed_at",          "DATETIME"),
                ]
                for col, coltype in additions:
                    if not _column_exists(conn, "watchlist_positions", col):
                        conn.execute(text(
                            f"ALTER TABLE watchlist_positions ADD COLUMN {col} {coltype}"
                        ))
                        print(f"[Migrations]  + watchlist_positions.{col}")

            # ── position_snapshots ───────────────────────────────────────────
            if _table_exists(conn, "position_snapshots"):
                if not _column_exists(conn, "position_snapshots", "interval_type"):
                    conn.execute(text(
                        "ALTER TABLE position_snapshots ADD COLUMN interval_type VARCHAR DEFAULT 'hourly'"
                    ))
                    print("[Migrations]  + position_snapshots.interval_type")

            # ── stock_daily_prices (CREATE if missing) ───────────────────────
            # SQLAlchemy's create_all handles this if the model is imported,
            # but we ensure it here as a safety net for existing deployments.
            if not _table_exists(conn, "stock_daily_prices"):
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS stock_daily_prices (
                        id          INTEGER PRIMARY KEY AUTOINCREMENT,
                        symbol      VARCHAR NOT NULL,
                        date        DATE    NOT NULL,
                        open        FLOAT,
                        high        FLOAT,
                        low         FLOAT,
                        close       FLOAT,
                        volume      FLOAT,
                        change_pct  FLOAT,
                        captured_at DATETIME,
                        UNIQUE(symbol, date)
                    )
                """))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_sdp_symbol ON stock_daily_prices (symbol)"
                ))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_sdp_date ON stock_daily_prices (date)"
                ))
                print("[Migrations]  + stock_daily_prices table created")

            conn.commit()
            print("[Migrations] All migrations complete.")

        except Exception as e:
            print(f"[Migrations] Error: {e}")
            traceback.print_exc()
