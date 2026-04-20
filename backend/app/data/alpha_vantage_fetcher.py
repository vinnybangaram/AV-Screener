import requests
import pandas as pd
from typing import Optional, Dict, Any
from app.utils.config import settings
from app.utils.format import format_symbol, strip_symbol

ALPHA_VANTAGE_API_KEY = settings.ALPHA_VANTAGE_API_KEY
BASE_URL = "https://www.alphavantage.co/query"

def fetch_av_daily(symbol: str) -> Optional[pd.DataFrame]:
    """Fetches daily historical data from Alpha Vantage."""
    if not ALPHA_VANTAGE_API_KEY:
        return None
        
    ticker = strip_symbol(symbol) # Alpha Vantage usually takes base symbol or specific equity formats
    # Note: For Indian stocks, AV uses .BSE or .NSE suffix or sometimes just symbol
    # For simplicity, we'll try to append .NSE if it's missing and it's an Indian stock context
    if not ticker.endswith(".NSE") and not ticker.endswith(".BSE"):
         ticker = f"{ticker}.BSE" # Default to BSE for standard AV compatibility

    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": ticker,
        "apikey": ALPHA_VANTAGE_API_KEY,
        "outputsize": "compact" # Last 100 data points
    }
    
    try:
        response = requests.get(BASE_URL, params=params)
        data = response.json()
        
        if "Time Series (Daily)" not in data:
            print(f"⚠️ Alpha Vantage error for {ticker}: {data.get('Error Message', data.get('Information', 'Unknown Error'))}")
            return None
            
        df = pd.DataFrame.from_dict(data["Time Series (Daily)"], orient='index')
        df.columns = ["Open", "High", "Low", "Close", "Volume"]
        df.index = pd.to_datetime(df.index)
        df = df.astype(float)
        df = df.sort_index()
        
        return df
    except Exception as e:
        print(f"Alpha Vantage exception for {ticker}: {e}")
        return None

def fetch_av_quote(symbol: str) -> Dict[str, Any]:
    """Fetches real-time price quote from Alpha Vantage."""
    if not ALPHA_VANTAGE_API_KEY:
        return {}
        
    ticker = strip_symbol(symbol)
    if not ticker.endswith(".NSE") and not ticker.endswith(".BSE"):
         ticker = f"{ticker}.BSE"

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": ticker,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    
    try:
        response = requests.get(BASE_URL, params=params)
        data = response.json()
        
        quote = data.get("Global Quote", {})
        if not quote:
            return {}
            
        return {
            "price": float(quote.get("05. price", 0)),
            "open": float(quote.get("02. open", 0)),
            "high": float(quote.get("03. high", 0)),
            "low": float(quote.get("04. low", 0)),
            "volume": int(quote.get("06. volume", 0)),
            "change": float(quote.get("09. change", 0)),
            "change_pct": float(quote.get("10. change percent", "0%").replace("%", ""))
        }
    except Exception as e:
        print(f"Alpha Vantage Quote Error for {ticker}: {e}")
        return {}
