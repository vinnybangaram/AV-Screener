import requests
import time
from typing import Dict, Any, List, Optional
from app.utils.config import settings
from app.utils.format import strip_symbol

FINNHUB_API_KEY = settings.FINNHUB_API_KEY
BASE_URL = "https://finnhub.io/api/v1"

def fetch_finnhub_quote(symbol: str) -> Dict[str, Any]:
    """Fetches real-time price from Finnhub."""
    if not FINNHUB_API_KEY:
        return {}
        
    ticker = strip_symbol(symbol)
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS" # Standardize for Finnhub Indian stocks
        
    url = f"{BASE_URL}/quote"
    params = {"symbol": ticker, "token": FINNHUB_API_KEY}
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "c" not in data or data["c"] == 0:
            return {}
            
        return {
            "price": data["c"],
            "change": data["d"],
            "change_pct": data["dp"],
            "high": data["h"],
            "low": data["l"],
            "open": data["o"],
            "prev_close": data["pc"]
        }
    except Exception as e:
        print(f"Finnhub Quote Error for {ticker}: {e}")
        return {}

def fetch_finnhub_news(symbol: str) -> List[Dict[str, Any]]:
    """Fetches company news from Finnhub."""
    if not FINNHUB_API_KEY:
        return []
        
    ticker = strip_symbol(symbol)
    if not ticker.endswith(".NS"): ticker = f"{ticker}.NS"
    
    from datetime import datetime, timedelta
    end = datetime.now().strftime('%Y-%m-%d')
    start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    url = f"{BASE_URL}/company-news"
    params = {
        "symbol": ticker,
        "from": start,
        "to": end,
        "token": FINNHUB_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        return response.json()[:5] # Top 5 news items
    except Exception as e:
        print(f"Finnhub News Error for {ticker}: {e}")
        return []
