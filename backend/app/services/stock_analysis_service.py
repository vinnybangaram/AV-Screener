import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from app.data.yahoo_fetcher import fetch_stock_data, fetch_fundamentals

def calculate_rsi(df: pd.DataFrame, period: int = 14) -> float:
    if len(df) < period: return 50.0
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1])

def calculate_mfi(df: pd.DataFrame, period: int = 14) -> float:
    """Calculates Money Flow Index."""
    if len(df) < period: return 50.0
    typical_price = (df['High'] + df['Low'] + df['Close']) / 3
    money_flow = typical_price * df['Volume']
    
    positive_flow = []
    negative_flow = []
    
    for i in range(1, len(typical_price)):
        if typical_price.iloc[i] > typical_price.iloc[i-1]:
            positive_flow.append(money_flow.iloc[i])
            negative_flow.append(0)
        else:
            positive_flow.append(0)
            negative_flow.append(money_flow.iloc[i])
            
    pos_res = pd.Series(positive_flow).rolling(window=period).sum()
    neg_res = pd.Series(negative_flow).rolling(window=period).sum()
    mfr = pos_res / neg_res
    mfi = 100 - (100 / (1 + mfr))
    return float(mfi.iloc[-1]) if not mfi.empty else 50.0

def calculate_macd(df: pd.DataFrame) -> Dict[str, Any]:
    if len(df) < 26: return {"status": "Neutral", "macd": 0, "signal": 0}
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9, adjust=False).mean()
    status = "Bullish" if macd.iloc[-1] > signal.iloc[-1] else "Bearish"
    return {"status": status, "macd": float(macd.iloc[-1]), "signal": float(signal.iloc[-1])}

def calculate_moving_averages(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculates a comprehensive stack of SMAs and EMAs."""
    periods = [5, 10, 20, 50, 100, 200]
    result = {"sma": {}, "ema": {}}
    for p in periods:
        if len(df) >= p:
            result["sma"][f"{p}"] = float(df['Close'].rolling(window=p).mean().iloc[-1])
            result["ema"][f"{p}"] = float(df['Close'].ewm(span=p, adjust=False).mean().iloc[-1])
        else:
            result["sma"][f"{p}"] = 0
            result["ema"][f"{p}"] = 0
    return result

def calculate_pivot_points(df: pd.DataFrame) -> Dict[str, float]:
    """Calculates Standard Pivot Points based on the last completed day."""
    if len(df) < 2: return {}
    last_row = df.iloc[-2] # Use previous day's high/low/close
    high, low, close = last_row['High'], last_row['Low'], last_row['Close']
    
    pivot = (high + low + close) / 3
    r1 = (2 * pivot) - low
    s1 = (2 * pivot) - high
    r2 = pivot + (high - low)
    s2 = pivot - (high - low)
    r3 = high + 2 * (pivot - low)
    s3 = low - 2 * (high - pivot)
    
    return {
        "pivot": float(pivot),
        "r1": float(r1), "r2": float(r2), "r3": float(r3),
        "s1": float(s1), "s2": float(s2), "s3": float(s3)
    }

def calculate_performance(df: pd.DataFrame) -> Dict[str, float]:
    """Calculates returns for various periods."""
    if df.empty: return {}
    current = df['Close'].iloc[-1]
    
    def get_ret(days):
        if len(df) > days:
            prev = df['Close'].iloc[-(days+1)]
            return ((current - prev) / prev) * 100
        return 0.0

    return {
        "1m": get_ret(21),
        "3m": get_ret(63),
        "1y": get_ret(252)
    }

def calculate_volume_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyzes volume trends."""
    if len(df) < 20: return {"status": "Normal", "avg_20d": 0}
    avg_20d = df['Volume'].rolling(window=20).mean().iloc[-2]
    curr_vol = df['Volume'].iloc[-1]
    
    status = "Normal"
    if curr_vol > avg_20d * 2.0: status = "Spike"
    elif curr_vol > avg_20d * 1.5: status = "High"
    elif curr_vol < avg_20d * 0.5: status = "Low"
    
    return {
        "status": status,
        "current": float(curr_vol),
        "avg_20d": float(avg_20d),
        "ratio": float(curr_vol / avg_20d) if avg_20d > 0 else 1.0
    }

def get_full_analysis(ticker: str) -> Optional[Dict[str, Any]]:
    # Fetch 2 years of data to support 1y performance and 200 DMA reliably
    df = fetch_stock_data(ticker, period="2y") 
    if df is None or df.empty: return None
    
    # Technicals
    rsi = calculate_rsi(df)
    mfi = calculate_mfi(df)
    macd = calculate_macd(df)
    ma_stack = calculate_moving_averages(df)
    pivots = calculate_pivot_points(df)
    performance = calculate_performance(df)
    volume = calculate_volume_analysis(df)
    
    # Fundamentals (from fetch_fundamentals mapping)
    fundamentals = fetch_fundamentals(ticker)
    
    curr_price = float(df['Close'].iloc[-1])
    # Simple trend logic: Price vs 50DMA
    trend = "Uptrend" if curr_price > ma_stack["sma"]["50"] else "Downtrend"

    # Format chart data (last 60 days)
    chart_data = df.tail(60).copy()
    chart_data.reset_index(inplace=True)
    chart_data = chart_data.rename(columns={'index': 'date'})
    chart_data['date'] = chart_data['date'].dt.strftime('%Y-%m-%d')
    
    return {
        "ticker": ticker,
        "price": curr_price,
        "change_pct": ((df['Close'].iloc[-1] - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100 if len(df) > 1 else 0,
        "technical": {
            "rsi": rsi,
            "mfi": mfi,
            "macd": macd,
            "ma_stack": ma_stack,
            "pivots": pivots,
            "trend": trend,
            "performance": performance
        },
        "volume": volume,
        "fundamentals": fundamentals,
        "chart_data": chart_data.to_dict(orient='records')
    }
