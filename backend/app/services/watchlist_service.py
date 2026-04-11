import yfinance as yf
from sqlalchemy.orm import Session
from app.models.watchlist import Watchlist
from app.schemas.user_watchlist import WatchlistAdd, WatchlistUpdate
from datetime import datetime
from typing import List, Dict

def get_watchlist(db: Session, user_id: int):
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    if not items:
        return []
    
    # Batch fetch prices using yfinance for performance
    symbols = [item.symbol for item in items]
    # Add .NS/ .BO if missing for yfinance consistent lookup
    yf_symbols = [s if (s.endswith(".NS") or s.endswith(".BO")) else f"{s}.NS" for s in symbols]
    
    try:
        data = yf.download(yf_symbols, period="1d", interval="1m", progress=False)
        # Handle single vs multiple symbols in yf.download result
        prices = {}
        if len(yf_symbols) == 1:
            if not data.empty:
                prices[symbols[0]] = data['Close'].iloc[-1]
        else:
            for i, sym in enumerate(symbols):
                yf_sym = yf_symbols[i]
                if yf_sym in data['Close']:
                    col_data = data['Close'][yf_sym].dropna()
                    if not col_data.empty:
                        prices[sym] = col_data.iloc[-1]
    except Exception as e:
        print(f"Error fetching batch prices: {e}")
        prices = {}

    result = []
    for item in items:
        curr_price = prices.get(item.symbol, item.added_price)
        p_l_abs = curr_price - item.added_price
        p_l_pct = (p_l_abs / item.added_price) * 100 if item.added_price > 0 else 0
        
        # In-memory mapping to schema format
        res_item = {
            "id": item.id,
            "user_id": item.user_id,
            "symbol": item.symbol,
            "added_price": item.added_price,
            "added_date": item.added_date,
            "source": item.source,
            "stop_loss": item.stop_loss,
            "target_price": item.target_price,
            "current_price": curr_price,
            "profit_loss_abs": p_l_abs,
            "profit_loss_pct": p_l_pct
        }
        result.append(res_item)
    
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

    db_item = Watchlist(
        user_id=user_id,
        symbol=watchlist_in.symbol.upper(),
        added_price=watchlist_in.added_price,
        source=watchlist_in.source,
        stop_loss=watchlist_in.stop_loss,
        target_price=watchlist_in.target_price
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
