import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from app.data.yahoo_fetcher import fetch_stock_data, fetch_fundamentals
from app.utils.format import format_symbol

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
            return float(((current - prev) / prev) * 100)
        return 0.0

    return {
        "1w": get_ret(5),
        "1m": get_ret(21),
        "3m": get_ret(63),
        "6m": get_ret(126),
        "9m": get_ret(189),
        "1y": get_ret(252),
        "2y": get_ret(504),
        "3y": get_ret(756),
        "5y": get_ret(1260)
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

from app.data.alpha_vantage_fetcher import fetch_av_daily, fetch_av_quote
from app.data.finnhub_fetcher import fetch_finnhub_quote

def get_full_analysis(ticker: str, period: str = "1y") -> Optional[Dict[str, Any]]:
    # Standardize symbol
    ticker = format_symbol(ticker)
    
    # 1. HYBRID FETCHING STRATEGY
    # Primary: Yahoo
    df = fetch_stock_data(ticker, period=period) 
    
    # Secondary Fallback: Alpha Vantage
    if df is None or df.empty:
        print(f"🔄 Switching to Alpha Vantage for {ticker}")
        df = fetch_av_daily(ticker)
        
    if df is None or df.empty:
        return None
    
    # 2. HYBRID QUOTE MELDING (For real-time accuracy)
    # We try to get the very latest price from Finnhub or AV to augment the chart data
    fh_quote = fetch_finnhub_quote(ticker)
    av_quote = fetch_av_quote(ticker)
    
    curr_price = float(df['Close'].iloc[-1])
    # If we have a more recent live price, use it
    if fh_quote.get("price"):
        curr_price = fh_quote["price"]
    elif av_quote.get("price"):
        curr_price = av_quote["price"]

    # Technicals (using the melded data)
    rsi = calculate_rsi(df)
    mfi = calculate_mfi(df)
    macd = calculate_macd(df)
    ma_stack = calculate_moving_averages(df)
    pivots = calculate_pivot_points(df)
    performance = calculate_performance(df)
    volume = calculate_volume_analysis(df)
    
    # Fundamentals (Hybrid Fallback)
    fundamentals = fetch_fundamentals(ticker)
    
    prev_close = float(df['Close'].iloc[-2]) if len(df) > 1 else curr_price
    
    # Simple trend logic: Price vs 50DMA
    trend = "Uptrend" if curr_price > ma_stack["sma"]["50"] else "Downtrend"

    # Format chart data (all 5y for Highcharts Stock)
    chart_data = df.copy()
    chart_data.reset_index(inplace=True)
    chart_data = chart_data.rename(columns={'index': 'date'})
    # Convert to timestamp for Highcharts
    chart_data['timestamp'] = chart_data['date'].apply(lambda x: int(x.timestamp() * 1000))
    chart_data['date_str'] = chart_data['date'].dt.strftime('%Y-%m-%d')
    
    # History analysis for summary card
    def get_period_stats(days):
        sub_df = df.tail(days)
        if sub_df.empty: return {"high": 0, "low": 0}
        return {"high": float(sub_df['High'].max()), "low": float(sub_df['Low'].min())}

    # Today's detailed metrics
    last_row = df.iloc[-1]
    today_metrics = {
        "open": float(last_row['Open']),
        "high": float(last_row['High']),
        "low": float(last_row['Low']),
        "close": float(last_row['Close']),
        "volume": float(last_row['Volume']),
        "prev_close": prev_close,
        "avg_price": float((last_row['High'] + last_row['Low'] + last_row['Close']) / 3),
        "upper_circuit": float(prev_close * 1.20),
        "lower_circuit": float(prev_close * 0.80),
        "stats_3m": get_period_stats(63),
        "stats_1y": get_period_stats(252),
        "stats_3y": get_period_stats(756),
        "stats_5y": get_period_stats(1260)
    }

    # Rename columns to lowercase for frontend compatibility
    chart_data = chart_data.rename(columns={
        'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'
    })


    return {
        "ticker": ticker,
        "current_price": curr_price,
        "price": curr_price, # Keep both for safety
        "change_pct": ((curr_price - prev_close) / prev_close) * 100 if len(df) > 1 else 0,
        "today": today_metrics,
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
        "chart_data": chart_data[['timestamp', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records'),
        "history": chart_data.tail(10)[['date_str', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records')
    }
