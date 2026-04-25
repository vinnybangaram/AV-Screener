from typing import Dict, Any
from app.data.yahoo_fetcher import fetch_fundamentals as fetch_raw_fundamentals

def get_fundamental_metrics(ticker: str) -> Dict[str, Any]:
    """
    Fetches and sanitizes fundamental data for a ticker.
    """
    raw = fetch_raw_fundamentals(ticker) or {}
    
    def safe_float(val, default=0.0):
        try:
            if val is None: return default
            return float(val)
        except:
            return default

    # Ensure all required fields exist with defaults
    return {
        "pe": safe_float(raw.get("pe"), 20.0),
        "pb": safe_float(raw.get("pb"), 3.0),
        "roe": safe_float(raw.get("roe"), 0.15) * 100,
        "roce": safe_float(raw.get("roce"), 0.18) * 100,
        "debt_eq": safe_float(raw.get("debt_to_equity"), 0.3),
        "sales_growth": safe_float(raw.get("revenue_growth"), 0.12) * 100,
        "profit_growth": safe_float(raw.get("earnings_growth"), 0.12) * 100,
        "market_cap": safe_float(raw.get("market_cap"), 1000000000),
        "promoter_holding": safe_float(raw.get("promoter_holding"), 51.0),
        "sector": str(raw.get("sector", "General"))
    }
