import yfinance as yf
import re

def _normalize_symbol(symbol: str) -> str:
    SYMBOL_MAP = {"L&T": "LT", "M&M": "MM", "PVR": "PVRINOX"}
    s = symbol.upper().strip()
    if s in SYMBOL_MAP:
        return SYMBOL_MAP[s]
    s = re.sub(r'[^A-Z0-9\-\.]', '', s)
    return s

def fetch_live_price(symbol):
    try:
        clean = _normalize_symbol(symbol)
        ticker_symbol = clean if (clean.endswith(".NS") or clean.endswith(".BO")) else f"{clean}.NS"
        ticker = yf.Ticker(ticker_symbol)
        for period in ["2d", "5d"]:
            try:
                hist = ticker.history(period=period)
                if not hist.empty:
                    return round(float(hist['Close'].iloc[-1]), 2)
            except Exception:
                pass
        return None
    except Exception as e:
        return f"ERROR: {e}"

SYMBOLS = ['NSLNISP', 'CENTRALBK', 'ZOMATO', 'RELIANCE', 'L&T', 'SBIN']
print("Testing all watchlist symbols...")
for s in SYMBOLS:
    price = fetch_live_price(s)
    clean = _normalize_symbol(s)
    print(f"  {s:15s} -> {clean:15s}.NS -> {price}")
