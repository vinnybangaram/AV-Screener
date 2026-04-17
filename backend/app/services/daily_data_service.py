"""
app/services/daily_data_service.py

Responsibilities
────────────────
1. fetch_and_store_eod()
   • Runs at ~3:40 PM IST (EOD) via the scheduler.
   • Reads every distinct symbol from WatchlistPosition.
   • Calls yfinance for 1-day OHLCV and upserts into StockDailyPrice.

2. backfill_symbol(symbol, days)
   • One-off backfill for a symbol (last N trading days).
   • Called automatically the first time a stock is added to the watchlist.

3. get_stock_chart_data(symbol, days)
   • Returns OHLCV rows for a symbol as a list of dicts — ready for
     Recharts / Chart.js candlestick or line charts on the dashboard.
"""

import yfinance as yf
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy import text
from app.database import SessionLocal
from app.models.watchlist   import WatchlistPosition
from app.models.daily_price import StockDailyPrice
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import traceback


# ─────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────

def _ns(symbol: str) -> str:
    """Append .NS if the symbol has no exchange suffix."""
    s = symbol.upper().strip()
    if s.endswith(".NS") or s.endswith(".BO"):
        return s
    return f"{s}.NS"


def _fetch_ohlcv(symbol: str, period: str = "1y") -> List[Dict]:
    """
    Fetch OHLCV history via yfinance.
    Returns a list of dicts: {date, open, high, low, close, volume, change_pct}
    """
    try:
        ticker = yf.Ticker(_ns(symbol))
        hist   = ticker.history(period=period)

        if hist is None or hist.empty:
            return []

        rows = []
        prev_close = None
        for ts, row in hist.iterrows():
            close  = round(float(row["Close"]), 2)
            change = round(((close - prev_close) / prev_close * 100), 2) if prev_close else 0.0
            rows.append({
                "date":       ts.date(),
                "open":       round(float(row["Open"]),   2),
                "high":       round(float(row["High"]),   2),
                "low":        round(float(row["Low"]),    2),
                "close":      close,
                "volume":     float(row["Volume"]),
                "change_pct": change,
            })
            prev_close = close

        return rows
    except Exception as e:
        print(f"[DailyData] _fetch_ohlcv failed for {symbol}: {e}")
        return []


def _upsert_rows(db: Session, symbol: str, rows: List[Dict]) -> int:
    """
    Upsert OHLCV rows. Skips existing (symbol, date) combos.
    Returns the count of rows inserted or updated.
    """
    if not rows:
        return 0

    count = 0
    for r in rows:
        existing = (
            db.query(StockDailyPrice)
            .filter(StockDailyPrice.symbol == symbol.upper(),
                    StockDailyPrice.date   == r["date"])
            .first()
        )
        if existing:
            # Update in case data was corrected (e.g., corporate actions)
            existing.open       = r["open"]
            existing.high       = r["high"]
            existing.low        = r["low"]
            existing.close      = r["close"]
            existing.volume     = r["volume"]
            existing.change_pct = r["change_pct"]
            existing.captured_at = datetime.utcnow()
        else:
            db.add(StockDailyPrice(
                symbol      = symbol.upper(),
                date        = r["date"],
                open        = r["open"],
                high        = r["high"],
                low         = r["low"],
                close       = r["close"],
                volume      = r["volume"],
                change_pct  = r["change_pct"],
                captured_at = datetime.utcnow(),
            ))
        count += 1

    db.commit()
    return count


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def fetch_and_store_eod() -> Dict:
    """
    EOD job — fetches today's OHLCV for every active watchlist symbol
    and stores it in stock_daily_prices.

    Triggered by the scheduler at 3:40 PM IST every weekday.
    """
    db = SessionLocal()
    summary = {"processed": 0, "failed": [], "rows_saved": 0}

    try:
        # Collect distinct active symbols
        symbols = [
            row[0] for row in
            db.query(WatchlistPosition.symbol)
              .filter(WatchlistPosition.is_active == True)
              .distinct()
              .all()
        ]

        if not symbols:
            print("[DailyData] No active symbols to fetch EOD data for.")
            return summary

        print(f"[DailyData] Fetching EOD for {len(symbols)} symbols…")

        for symbol in symbols:
            try:
                rows = _fetch_ohlcv(symbol, period="5d")   # Only last 5 days for EOD run
                saved = _upsert_rows(db, symbol, rows)
                summary["rows_saved"] += saved
                summary["processed"]  += 1
                print(f"[DailyData] {symbol}: {saved} rows saved")
            except Exception as e:
                print(f"[DailyData] EOD failed for {symbol}: {e}")
                summary["failed"].append(symbol)

    except Exception as e:
        print(f"[DailyData] Critical error in fetch_and_store_eod: {e}")
        traceback.print_exc()
    finally:
        db.close()

    print(f"[DailyData] EOD complete — {summary['processed']} symbols, {summary['rows_saved']} rows")
    return summary


def backfill_symbol(symbol: str, days: int = 365) -> int:
    """
    One-time backfill for a newly added watchlist symbol.
    Called from watchlist_service.add_to_watchlist() after DB insert.

    Returns number of rows stored.
    """
    db = SessionLocal()
    try:
        period = f"{days}d" if days <= 365 else "2y"
        rows   = _fetch_ohlcv(symbol, period=period)
        saved  = _upsert_rows(db, symbol, rows)
        print(f"[DailyData] Backfill {symbol}: {saved} rows")
        return saved
    except Exception as e:
        print(f"[DailyData] Backfill failed for {symbol}: {e}")
        return 0
    finally:
        db.close()


def get_stock_chart_data(
    symbol: str,
    days: int = 90,
    db: Optional[Session] = None
) -> Dict:
    """
    Returns OHLCV data for a single symbol, ready for frontend charting.

    Response shape:
    {
        "symbol": "RELIANCE",
        "candles": [
            {"date": "2025-01-15", "open": 2800, "high": 2850,
             "low": 2790, "close": 2840, "volume": 5200000, "change_pct": 1.2},
            ...
        ],
        "summary": {
            "current_price": 2840,
            "period_high":   2900,
            "period_low":    2700,
            "avg_volume":    4800000,
            "total_days":    90
        }
    }
    """
    close_db = False
    if db is None:
        db       = SessionLocal()
        close_db = True

    try:
        cutoff = date.today() - timedelta(days=days)

        rows = (
            db.query(StockDailyPrice)
              .filter(
                  StockDailyPrice.symbol == symbol.upper(),
                  StockDailyPrice.date   >= cutoff
              )
              .order_by(StockDailyPrice.date.asc())
              .all()
        )

        # If no data in DB, backfill on-the-fly
        if not rows:
            print(f"[DailyData] No data in DB for {symbol} — triggering backfill")
            backfill_symbol(symbol, days=max(days, 365))
            rows = (
                db.query(StockDailyPrice)
                  .filter(
                      StockDailyPrice.symbol == symbol.upper(),
                      StockDailyPrice.date   >= cutoff
                  )
                  .order_by(StockDailyPrice.date.asc())
                  .all()
            )

        candles = [
            {
                "date":       r.date.isoformat(),
                "open":       r.open,
                "high":       r.high,
                "low":        r.low,
                "close":      r.close,
                "volume":     r.volume,
                "change_pct": r.change_pct,
            }
            for r in rows
        ]

        if not candles:
            return {"symbol": symbol.upper(), "candles": [], "summary": {}}

        closes  = [c["close"]  for c in candles if c["close"]  is not None]
        volumes = [c["volume"] for c in candles if c["volume"] is not None]
        highs   = [c["high"]   for c in candles if c["high"]   is not None]
        lows    = [c["low"]    for c in candles if c["low"]    is not None]

        return {
            "symbol":  symbol.upper(),
            "candles": candles,
            "summary": {
                "current_price": closes[-1]        if closes   else 0,
                "period_high":   max(highs)        if highs    else 0,
                "period_low":    min(lows)          if lows     else 0,
                "avg_volume":    round(sum(volumes) / len(volumes)) if volumes else 0,
                "total_days":    len(candles),
            }
        }

    except Exception as e:
        print(f"[DailyData] get_stock_chart_data error for {symbol}: {e}")
        return {"symbol": symbol.upper(), "candles": [], "summary": {}, "error": str(e)}
    finally:
        if close_db:
            db.close()


def get_multi_stock_trend(symbols: List[str], days: int = 30) -> Dict:
    """
    Returns normalised close-price trend for multiple symbols on one chart.
    Used by the Portfolio Performance chart (% return basis, rebased to 100).
    """
    db = SessionLocal()
    try:
        cutoff = date.today() - timedelta(days=days)
        result = {}

        for symbol in symbols:
            rows = (
                db.query(StockDailyPrice.date, StockDailyPrice.close)
                  .filter(
                      StockDailyPrice.symbol == symbol.upper(),
                      StockDailyPrice.date   >= cutoff
                  )
                  .order_by(StockDailyPrice.date.asc())
                  .all()
            )

            # If no data in DB for this multi-stock entry, backfill on-the-fly
            if not rows:
                print(f"[DailyData] No data for {symbol} in MultiTrend — triggering backfill")
                backfill_symbol(symbol, days=max(days, 365))
                rows = (
                    db.query(StockDailyPrice.date, StockDailyPrice.close)
                      .filter(
                          StockDailyPrice.symbol == symbol.upper(),
                          StockDailyPrice.date   >= cutoff
                      )
                      .order_by(StockDailyPrice.date.asc())
                      .all()
                )

            if not rows:
                continue

            base = rows[0].close or 1
            result[symbol.upper()] = [
                {
                    "date":    r.date.isoformat(),
                    "indexed": round((r.close / base - 1) * 100, 2),  # % from entry
                    "close":   r.close,
                }
                for r in rows
            ]

        return result

    finally:
        db.close()
