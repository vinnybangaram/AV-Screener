"""
scratch/backfill_all.py

One-off script to backfill historical data for all existing watchlist items.
This ensures the new 'Portfolio Performance Intelligence' chart has data
to show immediately.
"""

import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.watchlist import WatchlistPosition
from app.services.daily_data_service import backfill_symbol

def backfill():
    db = SessionLocal()
    try:
        # Get all symbols that have ever been in a watchlist
        symbols = [
            row[0] for row in 
            db.query(WatchlistPosition.symbol)
              .distinct()
              .all()
        ]
        
        print(f"Found {len(symbols)} unique symbols to backfill.")
        
        for symbol in symbols:
            print(f"Backfilling {symbol}...")
            try:
                count = backfill_symbol(symbol, days=365)
                print(f"  Done: {count} rows saved.")
            except Exception as e:
                print(f"  Failed {symbol}: {e}")
                
        print("\nBackfill operation complete.")
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
