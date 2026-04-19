import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("d:/VINODH WORKS/PROJECTS/AV-Screener/backend"))

from app.services.market_service import get_daily_changes

symbols = ["RELIANCE", "TCS", "INFY"]
results = get_daily_changes(symbols)

print("Results for", symbols)
for sym, data in results.items():
    print(f"{sym}: {data}")

if not results:
    print("No results returned. Check internet connection or yfinance.")
