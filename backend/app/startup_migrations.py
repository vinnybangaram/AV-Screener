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
                    ("category",            "VARCHAR"),
                    ("side",                "VARCHAR DEFAULT 'LONG'"),
                    ("source_module",       "VARCHAR"),
                    ("is_active",           "BOOLEAN DEFAULT TRUE"),
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
                        try:
                            conn.execute(text(f"ALTER TABLE watchlist_positions ADD COLUMN {col} {coltype}"))
                            print(f"[Migrations]  + watchlist_positions.{col}")
                        except Exception as e:
                            print(f"[Migrations]  ! Failed to add watchlist_positions.{col}: {e}")

            # ── position_snapshots ───────────────────────────────────────────
            if _table_exists(conn, "position_snapshots"):
                snap_additions = [
                    ("interval_type", "VARCHAR DEFAULT 'hourly'"),
                    ("side",          "VARCHAR DEFAULT 'LONG'"),
                ]
                for col, coltype in snap_additions:
                    if not _column_exists(conn, "position_snapshots", col):
                        try:
                            conn.execute(text(f"ALTER TABLE position_snapshots ADD COLUMN {col} {coltype}"))
                            print(f"[Migrations]  + position_snapshots.{col}")
                        except Exception as e:
                            print(f"[Migrations]  ! Failed to add position_snapshots.{col}: {e}")

            # ── stock_daily_prices (CREATE if missing) ───────────────────────
            if not _table_exists(conn, "stock_daily_prices"):
                # Use a slightly more generic SQL for the safety net
                try:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS stock_daily_prices (
                            id          INTEGER PRIMARY KEY,
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
                    print("[Migrations]  + stock_daily_prices table safety created")
                except Exception:
                    pass # Base.metadata.create_all will catch it anyway

            # ── users ────────────────────────────────────────────────────────
            if _table_exists(conn, "users"):
                user_additions = [
                    ("avatar_url",          "VARCHAR"),
                    ("google_id",           "VARCHAR"),
                    ("hashed_password",     "VARCHAR"),
                    ("is_verified",         "BOOLEAN DEFAULT FALSE"),
                    ("verification_token",  "VARCHAR"),
                    ("role",                "VARCHAR DEFAULT 'user'"),
                    ("plan",                "VARCHAR DEFAULT 'free'"),
                    ("login_count",         "INTEGER DEFAULT 1"),
                    ("created_at",          "DATETIME DEFAULT CURRENT_TIMESTAMP"),
                    ("last_login_at",       "DATETIME DEFAULT CURRENT_TIMESTAMP"),
                    ("is_active",           "BOOLEAN DEFAULT TRUE"),
                ]
                for col, coltype in user_additions:
                    if not _column_exists(conn, "users", col):
                        try:
                            # Use text(...) for safe execution
                            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {coltype}"))
                            print(f"[Migrations]  + users.{col}")
                        except Exception as e:
                            print(f"[Migrations]  ! Failed to add users.{col}: {e}")

            # ── option_trades ────────────────────────────────────────────────
            if _table_exists(conn, "option_trades"):
                trade_additions = [
                    ("tsl_1",              "FLOAT"),
                    ("tsl_2",              "FLOAT"),
                    ("tsl_3",              "FLOAT"),
                    ("tsl_1_hit",          "BOOLEAN DEFAULT FALSE"),
                    ("tsl_2_hit",          "BOOLEAN DEFAULT FALSE"),
                    ("tsl_3_hit",          "BOOLEAN DEFAULT FALSE"),
                    ("current_tsl",        "FLOAT"),
                    ("partial_booked",     "BOOLEAN DEFAULT FALSE"),
                    ("realized_partial_pnl", "FLOAT DEFAULT 0.0"),
                    ("active_multiplier",  "FLOAT DEFAULT 1.0"),
                ]
                for col, coltype in trade_additions:
                    if not _column_exists(conn, "option_trades", col):
                        try:
                            conn.execute(text(f"ALTER TABLE option_trades ADD COLUMN {col} {coltype}"))
                            print(f"[Migrations]  + option_trades.{col}")
                        except Exception as e:
                            print(f"[Migrations]  ! Failed to add option_trades.{col}: {e}")

            # ── option_settings ──────────────────────────────────────────────
            if _table_exists(conn, "option_settings"):
                settings_additions = [
                    ("whatsapp_alerts",     "BOOLEAN DEFAULT FALSE"),
                    ("phone_number",        "VARCHAR"),
                ]
                for col, coltype in settings_additions:
                    if not _column_exists(conn, "option_settings", col):
                        try:
                            conn.execute(text(f"ALTER TABLE option_settings ADD COLUMN {col} {coltype}"))
                            print(f"[Migrations]  + option_settings.{col}")
                        except Exception as e:
                            print(f"[Migrations]  ! Failed to add option_settings.{col}: {e}")

            conn.commit()
            print("[Migrations] All migrations complete.")

        except Exception as e:
            print(f"[Migrations] Error: {e}")
            traceback.print_exc()
