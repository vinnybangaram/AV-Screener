import pandas as pd
from app.utils.indicators import calculate_rsi, calculate_macd, calculate_sma, calculate_atr

def compute_technicals(df: pd.DataFrame):
    """
    Computes a comprehensive set of technical indicators for a given dataframe.
    """
    if df is None or len(df) < 50:
        return {}
        
    close = df['Close']
    high = df['High']
    low = df['Low']
    volume = df['Volume']
    
    # 1. Trend Indicators
    sma20 = calculate_sma(close, 20).iloc[-1]
    sma50 = calculate_sma(close, 50).iloc[-1]
    sma200 = calculate_sma(close, 200).iloc[-1]
    
    # 2. Momentum Indicators
    rsi = calculate_rsi(close).iloc[-1]
    macd, signal = calculate_macd(close)
    macd_val = macd.iloc[-1]
    signal_val = signal.iloc[-1]
    
    # 3. Volatility
    atr = calculate_atr(high, low, close).iloc[-1]
    
    # 4. Volume
    vol20 = calculate_sma(volume, 20).iloc[-1]
    current_vol = volume.iloc[-1]
    
    # 5. Price Action
    current_price = close.iloc[-1]
    prev_close = close.iloc[-2]
    day_change = (current_price / prev_close - 1) * 100
    
    # Breakout Logic
    recent_high = high.iloc[-20:-1].max()
    is_breakout = current_price > recent_high and current_vol > vol20 * 1.5
    
    def safe_f(val):
        try:
            import numpy as np
            if pd.isna(val) or np.isinf(val): return 0.0
            return float(val)
        except:
            return 0.0

    return {
        "rsi": safe_f(rsi),
        "macd": safe_f(macd_val),
        "macd_signal": safe_f(signal_val),
        "sma20": safe_f(sma20),
        "sma50": safe_f(sma50),
        "sma200": safe_f(sma200),
        "atr": safe_f(atr),
        "vol20": safe_f(vol20),
        "current_vol": safe_f(current_vol),
        "day_change": safe_f(day_change),
        "is_breakout": bool(is_breakout),
        "above_50": bool(current_price > sma50),
        "above_200": bool(current_price > sma200)
    }
