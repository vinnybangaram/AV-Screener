"""
app/services/watchlist_service.py

Responsibilities
────────────────
1. Entry/Exit logic with price capture
2. Automated Intraday rotation
3. Performance tracking
"""

import yfinance as yf
from sqlalchemy.orm import Session
from app.models.watchlist import WatchlistPosition, PositionSnapshot
from app.schemas.user_watchlist import WatchlistAdd, WatchlistUpdate
from datetime import datetime
from typing import List, Dict, Optional
from app.utils.strategy_engine import get_strategy_recommendation
from concurrent.futures import ThreadPoolExecutor


def _normalize_symbol(symbol: str) -> str:
    import re
    SYMBOL_MAP = {
        "L&T":    "LT",
        "M&M":    "MM",
        "M&MFIN": "MMFIN",
        "PVR":    "PVRINOX",
        "ZOMATO": "ETERNAL",
    }
    s = symbol.upper().strip()
    if s in SYMBOL_MAP:
        return SYMBOL_MAP[s]
    s = re.sub(r'[^A-Z0-9\-\.]', '', s)
    return s


def fetch_live_price(symbol: str) -> Optional[float]:
    if not symbol:
        return None
    try:
        clean = _normalize_symbol(symbol)
        ticker_symbol = clean if (clean.endswith(".NS") or clean.endswith(".BO")) else f"{clean}.NS"
        ticker = yf.Ticker(ticker_symbol)

        # Primary: 2d history
        try:
            hist = ticker.history(period="2d")
            if not hist.empty:
                return float(hist["Close"].iloc[-1])
        except Exception:
            pass

        # Fallback: fast_info
        try:
            fi    = ticker.fast_info
            price = fi.get("lastPrice") or fi.get("last_price") or fi.get("regularMarketPrice")
            if price:
                return float(price)
        except Exception:
            pass

        return None
    except Exception as e:
        print(f"[WatchlistService] fetch_live_price error for {symbol}: {e}")
        return None


def _fetch_company_name(symbol: str) -> str:
    """Best-effort company name from yfinance; falls back to symbol."""
    try:
        clean  = _normalize_symbol(symbol)
        ns     = clean if (clean.endswith(".NS") or clean.endswith(".BO")) else f"{clean}.NS"
        info   = yf.Ticker(ns).info
        return info.get("longName") or info.get("shortName") or symbol.upper()
    except Exception:
        return symbol.upper()


# ──────────────────────────────────────────────────────────────────────────────
# READ
# ──────────────────────────────────────────────────────────────────────────────

def get_watchlist(db: Session, user_id: int, include_inactive: bool = False):
    query = db.query(WatchlistPosition).filter(WatchlistPosition.user_id == user_id)
    if not include_inactive:
        query = query.filter(WatchlistPosition.is_active == True)

    items = query.all()
    if not items:
        return []

    result = []
    for item in items:
        entry_price = float(item.entry_price or 0)
        curr_price  = float(item.latest_price or entry_price)

        p_l_abs = curr_price - entry_price
        p_l_pct = (p_l_abs / entry_price * 100) if entry_price > 0 else 0.0

        # Safety fallback for SL/target — authoritative check is in the alert scan job
        if item.status == "ACTIVE":
            if item.stop_loss and curr_price <= item.stop_loss:
                item.status = "SL_HIT"
            elif item.target_price and curr_price >= item.target_price:
                item.status = "TARGET_HIT"

        result.append({
            "id":                item.id,
            "user_id":           item.user_id,
            "symbol":            item.symbol,
            "company_name":      item.company_name or item.symbol,
            "category":          item.category,
            "source_module":     item.source_module,
            "added_at":          item.added_at,
            "entry_price":       entry_price,
            "quantity":          item.quantity,
            "is_active":         item.is_active,
            "status":            item.status,
            "stop_loss":         item.stop_loss,
            "target_price":      item.target_price,
            "latest_price":      round(curr_price, 2),
            "latest_pnl":        round(p_l_abs, 2),
            "latest_pnl_percent": round(p_l_pct, 2),
            "updated_at":        item.updated_at,
        })

    return result


# ──────────────────────────────────────────────────────────────────────────────
# CREATE
# ──────────────────────────────────────────────────────────────────────────────

def add_to_watchlist(db: Session, user_id: int, watchlist_in: WatchlistAdd):
    # Idempotent — return existing if already active
    existing = (
        db.query(WatchlistPosition)
          .filter(
              WatchlistPosition.user_id  == user_id,
              WatchlistPosition.symbol   == watchlist_in.symbol.upper(),
              WatchlistPosition.is_active == True,
          )
          .first()
    )
    if existing:
        return existing

    # Live price
    entry_price = watchlist_in.entry_price
    if entry_price is None:
        entry_price = fetch_live_price(watchlist_in.symbol) or 0.0

    # Category inference
    final_category = watchlist_in.category
    source = (watchlist_in.source_module or "").lower()
    if not final_category or final_category in ("Manual", "Default"):
        if   "penny"       in source: final_category = "Penny"
        elif "multibagger" in source: final_category = "Multibagger"
        elif "intraday"    in source: final_category = "Intraday"
        else:                          final_category = "Manual"

    # Auto SL/Target
    sl, target = get_strategy_recommendation(
        watchlist_in.symbol, entry_price, final_category
    )

    # Company name (non-blocking — falls back to symbol if yfinance is slow)
    company_name = _fetch_company_name(watchlist_in.symbol)

    db_item = WatchlistPosition(
        user_id      = user_id,
        symbol       = watchlist_in.symbol.upper(),
        company_name = company_name,
        entry_price  = entry_price,
        category     = final_category,
        source_module= watchlist_in.source_module or "Manual",
        status       = "ACTIVE",
        is_active    = True,
        stop_loss    = sl,
        target_price = target,
        latest_price = entry_price,
        latest_pnl   = 0.0,
        latest_pnl_percent = 0.0,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Initial snapshot
    db.add(PositionSnapshot(
        position_id  = db_item.id,
        user_id      = user_id,
        symbol       = db_item.symbol,
        price        = entry_price,
        pnl          = 0.0,
        pnl_percent  = 0.0,
        interval_type= "hourly",
    ))
    db.commit()

    # ── NEW: Kick off daily OHLCV backfill in background thread ──
    # This ensures chart data is available immediately after add.
    try:
        from app.services.daily_data_service import backfill_symbol
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=1) as ex:
            ex.submit(backfill_symbol, db_item.symbol, 365)
    except Exception as e:
        # Non-fatal — chart will auto-backfill on first /chart/stock call
        print(f"[WatchlistService] Background backfill skipped: {e}")

    return db_item


# ──────────────────────────────────────────────────────────────────────────────
# UPDATE / DELETE
# ──────────────────────────────────────────────────────────────────────────────

def update_watchlist(db: Session, user_id: int, watchlist_id: int, watchlist_in: WatchlistUpdate):
    db_item = (
        db.query(WatchlistPosition)
          .filter(WatchlistPosition.id == watchlist_id,
                  WatchlistPosition.user_id == user_id)
          .first()
    )
    if not db_item:
        return None

    if watchlist_in.stop_loss    is not None: db_item.stop_loss    = watchlist_in.stop_loss
    if watchlist_in.target_price is not None: db_item.target_price = watchlist_in.target_price
    if watchlist_in.is_active    is not None:
        db_item.is_active = watchlist_in.is_active
        if not db_item.is_active:
            db_item.removed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_item)
    return db_item


def remove_from_watchlist(db: Session, user_id: int, watchlist_id: int) -> bool:
    db_item = (
        db.query(WatchlistPosition)
          .filter(WatchlistPosition.id == watchlist_id,
                  WatchlistPosition.user_id == user_id)
          .first()
    )
    if not db_item:
        return False

    db_item.is_active  = False
    db_item.removed_at = datetime.utcnow()
    db.commit()
    return True


# ──────────────────────────────────────────────────────────────────────────────
# SCHEDULER JOB
# ──────────────────────────────────────────────────────────────────────────────

def auto_sync_intraday_radar(db: Session):
    """
    System job: Clears yesterday's intraday stocks and adds today's setups.
    Called at 9:20 AM IST by the scheduler.
    """
    from app.services import intraday_service
    import asyncio

    print("[WatchlistService] Running automated Intraday Sync…")

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        scan = loop.run_until_complete(intraday_service.run_intraday_scan())
        loop.close()
    except Exception as e:
        print(f"[WatchlistService] Intraday Scan failed: {e}")
        return

    all_setups = scan.get("longs", []) + scan.get("shorts", [])
    if not all_setups:
        print("[WatchlistService] No intraday setups found.")
        return

    from app.models.user import User
    users = db.query(User).all()

    for user in users:
        # Archive previous intraday positions
        for item in (
            db.query(WatchlistPosition)
              .filter(WatchlistPosition.user_id == user.id,
                      WatchlistPosition.category == "Intraday",
                      WatchlistPosition.is_active == True)
              .all()
        ):
            item.is_active  = False
            item.status     = "CLOSED"
            item.removed_at = datetime.utcnow()

        # Add today's high-conviction setups (score >= 70)
        for setup in all_setups:
            if setup.get("score", 0) >= 70:
                add_to_watchlist(db, user.id, WatchlistAdd(
                    symbol       = setup["ticker"],
                    entry_price  = setup["price"],
                    category     = "Intraday",
                    source_module= "Intraday Radar",
                    stop_loss    = setup["stoploss"],
                    target_price = setup["target"],
                ))

    db.commit()
    print("[WatchlistService] Intraday Auto-Sync complete.")
