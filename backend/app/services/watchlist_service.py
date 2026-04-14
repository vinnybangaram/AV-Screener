import yfinance as yf
from sqlalchemy.orm import Session
from app.models.watchlist import Watchlist
from app.schemas.user_watchlist import WatchlistAdd, WatchlistUpdate
from datetime import datetime
from typing import List, Dict
from app.utils.strategy_engine import get_strategy_recommendation
from concurrent.futures import ThreadPoolExecutor

def fetch_live_price(symbol: str):
    """Fetch live NSE price via yfinance. Returns None on failure."""
    try:
        ticker_symbol = symbol if (symbol.endswith(".NS") or symbol.endswith(".BO")) else f"{symbol}.NS"
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="1d", interval="1m")
        if not hist.empty:
            return float(hist['Close'].iloc[-1])
        info = ticker.fast_info
        return float(info.last_price) if hasattr(info, 'last_price') else None
    except Exception:
        return None

def get_watchlist(db: Session, user_id: int):
    # ── INTRADAY CLEANUP LOGIC ──
    # Requirement: Remove intraday stocks once market is closed (3:30 PM IST = 10:00 AM UTC)
    now = datetime.utcnow()
    is_after_market = now.hour >= 10 # 10 AM UTC = 3:30 PM IST
    
    # Identify items to clean
    # 1. Any 'Intraday' item added on a previous day
    # 2. Any 'Intraday' item if it's currently after market hours
    items_to_clean = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.source.ilike("%intraday%"),
        ((Watchlist.added_date < datetime(now.year, now.month, now.day)) | (is_after_market))
    ).all()
    
    if items_to_clean:
        for item in items_to_clean:
            db.delete(item)
        db.commit()

    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    if not items:
        return []
    
    # ── Batch fetch live prices in parallel ──
    symbols = [item.symbol for item in items]
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        live_prices = list(executor.map(fetch_live_price, symbols))

    result = []
    status_changed = False
    
    for item, live_price in zip(items, live_prices):
        added_price = float(item.added_price or 0)
        curr_price = live_price if live_price is not None else added_price  # fallback to entry if fetch fails
        
        p_l_abs = curr_price - added_price
        p_l_pct = (p_l_abs / added_price * 100) if added_price > 0 else 0.0

        # Auto SL/Target logic if missing
        if not item.stop_loss and added_price > 0:
            item.stop_loss = round(added_price * 0.93, 2)
            item.target_price = round(added_price * 1.15, 2)
            status_changed = True
        
        # ── AUTO MONITORING ──
        # Check if SL or Target Hit ONLY IF currently ACTIVE
        current_status = item.status or "ACTIVE"
        if current_status == "ACTIVE":
            if item.stop_loss and curr_price <= item.stop_loss:
                item.status = "SL_HIT"
                status_changed = True
            elif item.target_price and curr_price >= item.target_price:
                item.status = "TARGET_HIT"
                status_changed = True
        
        # In-memory mapping to schema format
        res_item = {
            "id": item.id,
            "user_id": item.user_id,
            "symbol": item.symbol,
            "added_price": added_price,
            "added_date": item.added_date,
            "source": item.source,
            "status": item.status or "ACTIVE",
            "stop_loss": float(item.stop_loss) if item.stop_loss else None,
            "target_price": float(item.target_price) if item.target_price else None,
            "current_price": round(curr_price, 2),
            "profit_loss_abs": round(p_l_abs, 2),
            "profit_loss_pct": round(p_l_pct, 2)
        }
        result.append(res_item)

    if status_changed:
        db.commit()
    
    return result

def add_to_watchlist(db: Session, user_id: int, watchlist_in: WatchlistAdd):
    # Check if symbol already exists for this user
    existing_item = db.query(Watchlist).filter(
        Watchlist.user_id == user_id, 
        Watchlist.symbol == watchlist_in.symbol.upper()
    ).first()
    
    if existing_item:
        existing_item.added_price = watchlist_in.added_price
        existing_item.source = watchlist_in.source
        db.commit()
        db.refresh(existing_item)
        return existing_item

    # ── AUTO ENGINE CALL ──
    # User shouldn't input SL/Target manually anymore. We force system-generated.
    sl, target = get_strategy_recommendation(
        watchlist_in.symbol, 
        watchlist_in.added_price, 
        watchlist_in.source
    )

    db_item = Watchlist(
        user_id=user_id,
        symbol=watchlist_in.symbol.upper(),
        added_price=watchlist_in.added_price,
        source=watchlist_in.source,
        status="ACTIVE",
        stop_loss=sl,
        target_price=target
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_watchlist(db: Session, user_id: int, watchlist_id: int, watchlist_in: WatchlistUpdate):
    db_item = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user_id).first()
    if not db_item:
        return None
    
    if watchlist_in.stop_loss is not None:
        db_item.stop_loss = watchlist_in.stop_loss
    if watchlist_in.target_price is not None:
        db_item.target_price = watchlist_in.target_price
        
    db.commit()
    db.refresh(db_item)
    return db_item

def remove_from_watchlist(db: Session, user_id: int, watchlist_id: int):
    db_item = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user_id).first()
    if not db_item:
        return False
    
    db.delete(db_item)
    db.commit()
    return True
