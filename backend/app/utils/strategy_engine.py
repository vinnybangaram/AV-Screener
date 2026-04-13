import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

def calculate_volatility(symbol: str) -> float:
    """
    Calculates a simple volatility measure based on the last 5 days of price movement.
    Returns the average daily high-low range as a percentage of price.
    """
    try:
        yf_sym = symbol if symbol.endswith((".NS", ".BO")) else f"{symbol}.NS"
        ticker = yf.Ticker(yf_sym)
        hist = ticker.history(period="5d")
        if hist.empty:
            return 3.0 # Default fallback volatility: 3%
        
        # Calculate daily range %
        daily_range = (hist['High'] - hist['Low']) / hist['Low'] * 100
        avg_volatility = daily_range.mean()
        
        # Keep it within sane bounds (min 1%, max 10% for engine safety)
        return max(min(avg_volatility, 10.0), 1.0)
    except Exception as e:
        print(f"[StrategyEngine] Volatility calc error for {symbol}: {e}")
        return 3.0

def get_strategy_recommendation(symbol: str, price: float, category: str):
    """
    Calculates Stop Loss and Target Price based on quantitative strategy.
    
    Categories: multibagger, pennystorm, intraday
    Returns: (stop_loss, target_price)
    """
    volatility = calculate_volatility(symbol)
    cat = category.lower()
    
    # ── Strategy Config ──
    # Multiplier defines how many 'volatility units' to use for SL
    # Ratio defines the Reward (R:R) for the target
    config = {
        "multibagger": {"multiplier": 1.5, "ratio": 3.0}, # Wider targets for long term
        "pennystorm":  {"multiplier": 2.0, "ratio": 2.0}, # Higher SL buffer for penny volatility
        "intraday":    {"multiplier": 1.0, "ratio": 1.5}, # Tight SL and quick targets
        "default":     {"multiplier": 1.5, "ratio": 2.0}
    }
    
    # Extract config
    conf = config.get(cat)
    if not conf:
        # Check for partial matches
        if 'penny' in cat: conf = config["pennystorm"]
        elif 'multi' in cat: conf = config["multibagger"]
        elif 'intra' in cat: conf = config["intraday"]
        else: conf = config["default"]

    # Calculate SL
    sl_distance_pct = volatility * conf["multiplier"]
    sl_price = price * (1 - (sl_distance_pct / 100))
    
    # Calculate Target
    sl_distance_abs = price - sl_price
    target_price = price + (sl_distance_abs * conf["ratio"])
    
    return round(sl_price, 2), round(target_price, 2)
