import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.services.conviction_service import calculate_conviction_score

def seed_conviction():
    marquee_stocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ZOMATO", "TATASTEEL", "ADANIENT", "BHARTIARTL", "ICICIBANK", "WIPRO"]
    db = SessionLocal()
    print(f"Seeding initial conviction scores for {len(marquee_stocks)} stocks...")
    
    try:
        for symbol in marquee_stocks:
            print(f"  - Calculating score for {symbol}...")
            calculate_conviction_score(symbol, db, save=True)
        print("Seeding complete. Dashboard should now show data.")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_conviction()
