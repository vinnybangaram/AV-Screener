"""
app/api/stock_chart.py

Chart data endpoints — per-stock OHLCV history and
multi-stock comparison trend for the dashboard.

Mount in main.py:
    from app.api import stock_chart
    app.include_router(stock_chart.router, prefix="/api", tags=["Charts"])
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.daily_data_service import (
    get_stock_chart_data,
    get_multi_stock_trend,
    backfill_symbol,
)
from app.services.watchlist_service import get_watchlist

router = APIRouter()


# ─────────────────────────────────────────────
# 1.  Single stock OHLCV chart
#     GET /api/chart/stock/{symbol}?days=90
# ─────────────────────────────────────────────

@router.get("/chart/stock/{symbol}")
def stock_chart(
    symbol:       str,
    days:         int  = Query(default=90,  ge=7,   le=730),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Returns OHLCV candles for a single symbol.

    Response:
        {
            "symbol": "RELIANCE",
            "candles": [
                {"date": "2025-01-15", "open": 2800, "high": 2850,
                 "low": 2790, "close": 2840, "volume": 5200000, "change_pct": 1.2},
                ...
            ],
            "summary": {
                "current_price": 2840,
                "period_high": 2900,
                "period_low": 2700,
                "avg_volume": 4800000,
                "total_days": 90
            }
        }
    """
    data = get_stock_chart_data(symbol=symbol, days=days, db=db)

    if not data.get("candles"):
        # Trigger a fresh backfill if no data found at all
        backfill_symbol(symbol, days=365)
        data = get_stock_chart_data(symbol=symbol, days=days, db=db)

    if not data.get("candles"):
        raise HTTPException(
            status_code=404,
            detail=f"No historical data found for {symbol.upper()}. "
                   "Check the symbol and try again."
        )

    return data


# ─────────────────────────────────────────────
# 2.  Portfolio-level comparison trend
#     GET /api/chart/portfolio?days=30&category=All
# ─────────────────────────────────────────────

@router.get("/chart/portfolio")
def portfolio_trend(
    days:         int  = Query(default=30, ge=7, le=365),
    category:     str  = Query(default="All"),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Returns a normalised (rebased-to-100) price trend for every
    watchlist stock owned by the user, filtered by category.

    Designed to power the 'Portfolio Performance Intelligence' chart
    on the dashboard — multiple lines, one per stock.

    Response:
        {
            "RELIANCE":  [{"date": "2025-01-15", "indexed": 0,    "close": 2800}, ...],
            "ZOMATO":    [{"date": "2025-01-15", "indexed": 3.2,  "close": 254},  ...],
            ...
        }
    """
    watchlist = get_watchlist(db, current_user.id)

    # Robust category matching
    cat_lower = category.lower()
    if cat_lower in ("all", "investment", "all assets"):
        if cat_lower == "investment":
            watchlist = [w for w in watchlist if "intraday" not in (w.get("category") or "").lower()]
    elif "intraday" in cat_lower:
        if "long" in cat_lower:
            watchlist = [w for w in watchlist if "intraday" in (w.get("category") or "").lower() and (w.get("side") or "LONG").upper() != "SHORT"]
        elif "short" in cat_lower:
            watchlist = [w for w in watchlist if "intraday" in (w.get("category") or "").lower() and (w.get("side") or "").upper() == "SHORT"]
        else:
            watchlist = [w for w in watchlist if "intraday" in (w.get("category") or "").lower()]
    else:
        # Map tab labels to standard category prefixes
        cat_map = {
            "penny stocks": "penny",
            "pennystocks": "penny",
            "multibaggers": "multibagger",
            "core portfolio": "core",
            "core": "core",
            "swing": "swing",
            "trading": "intraday"
        }
        target = cat_map.get(cat_lower, cat_lower)
        # Use substring match to be flexible with pluralization/labels
        watchlist = [w for w in watchlist if target in (w.get("category") or "").lower()]

    symbols = list({w["symbol"] for w in watchlist})
    if not symbols:
        return {}

    return get_multi_stock_trend(symbols=symbols, days=days)


# ─────────────────────────────────────────────
# 3.  Manual backfill trigger (admin only)
#     POST /api/chart/backfill/{symbol}
# ─────────────────────────────────────────────

@router.post("/chart/backfill/{symbol}")
def trigger_backfill(
    symbol:       str,
    days:         int  = Query(default=365, ge=30, le=730),
    current_user: User = Depends(get_current_user),
):
    """
    Admin-only: manually trigger historical data backfill for a symbol.
    Useful when a new stock is added to the watchlist mid-season.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    saved = backfill_symbol(symbol, days=days)
    return {"symbol": symbol.upper(), "rows_saved": saved}
