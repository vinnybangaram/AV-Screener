import pandas as pd
import numpy as np
import asyncio
import httpx
from typing import Dict, Any, Optional
from app.data.yahoo_fetcher import fetch_stock_data, fetch_fundamentals
from app.utils.format import format_symbol
from app.data.alpha_vantage_fetcher import fetch_av_daily, ALPHA_VANTAGE_API_KEY, BASE_URL as AV_BASE_URL
from app.data.finnhub_fetcher import FINNHUB_API_KEY, BASE_URL as FH_BASE_URL
from app.utils.format import strip_symbol

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
        "1w": get_ret(5), "1m": get_ret(21), "3m": get_ret(63),
        "6m": get_ret(126), "9m": get_ret(189), "1y": get_ret(252),
        "2y": get_ret(504), "3y": get_ret(756), "5y": get_ret(1260)
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
        "status": status, "current": float(curr_vol), "avg_20d": float(avg_20d),
        "ratio": float(curr_vol / avg_20d) if avg_20d > 0 else 1.0
    }

async def fetch_async_quote_finnhub(client, ticker):
    if not FINNHUB_API_KEY: return {}
    try:
        url = f"{FH_BASE_URL}/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
        resp = await client.get(url, timeout=2)
        if resp.status_code == 200:
            d = resp.json()
            return {"price": d.get("c")}
    except: pass
    return {}

async def fetch_async_quote_av(client, ticker):
    if not ALPHA_VANTAGE_API_KEY: return {}
    try:
        av_ticker = f"{strip_symbol(ticker)}.BSE"
        params = {"function": "GLOBAL_QUOTE", "symbol": av_ticker, "apikey": ALPHA_VANTAGE_API_KEY}
        resp = await client.get(AV_BASE_URL, params=params, timeout=2)
        if resp.status_code == 200:
            d = resp.json().get("Global Quote", {})
            return {"price": float(d.get("05. price", 0))}
    except: pass
    return {}

async def get_full_analysis(ticker: str, period: str = "1y") -> Optional[Dict[str, Any]]:
    ticker = format_symbol(ticker)
    
    # 1. Fetch historical data (Synchronous for now as yfinance is sync)
    df = await asyncio.to_thread(fetch_stock_data, ticker, period=period)
    
    if df is None or df.empty:
        df = await asyncio.to_thread(fetch_av_daily, ticker)
        
    if df is None or df.empty:
        return None

    # 2. Parallel secondary quotes and fundamentals
    async with httpx.AsyncClient() as client:
        # We also fetch fundamentals in parallel thread if it was slow, but it's local db so no need
        fh_task = fetch_async_quote_finnhub(client, ticker)
        av_task = fetch_async_quote_av(client, ticker)
        
        fh_quote, av_quote = await asyncio.gather(fh_task, av_task)

    curr_price = float(df['Close'].iloc[-1])
    if fh_quote.get("price"): curr_price = fh_quote["price"]
    elif av_quote.get("price"): curr_price = av_quote["price"]

    # 3. Heavy calculation compute in threads if needed, but these are fast pandas ops
    rsi = calculate_rsi(df)
    mfi = calculate_mfi(df)
    macd = calculate_macd(df)
    ma_stack = calculate_moving_averages(df)
    pivots = calculate_pivot_points(df)
    performance = calculate_performance(df)
    volume = calculate_volume_analysis(df)
    fundamentals = fetch_fundamentals(ticker)
    
    prev_close = float(df['Close'].iloc[-2]) if len(df) > 1 else curr_price
    trend = "Uptrend" if curr_price > ma_stack["sma"]["50"] else "Downtrend"

    chart_data = df.copy().reset_index().rename(columns={'index': 'date'})
    chart_data['timestamp'] = chart_data['date'].apply(lambda x: int(x.timestamp() * 1000))
    chart_data['date_str'] = chart_data['date'].dt.strftime('%Y-%m-%d')
    chart_data = chart_data.rename(columns={'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'})

    def get_period_stats(days):
        sub_df = df.tail(days)
        return {"high": float(sub_df['High'].max()) if not sub_df.empty else 0, "low": float(sub_df['Low'].min()) if not sub_df.empty else 0}

    today_metrics = {
        "open": float(df.iloc[-1]['Open']), "high": float(df.iloc[-1]['High']), "low": float(df.iloc[-1]['Low']),
        "close": float(df.iloc[-1]['Close']), "volume": float(df.iloc[-1]['Volume']), "prev_close": prev_close,
        "upper_circuit": prev_close * 1.20, "lower_circuit": prev_close * 0.80,
        "stats_1y": get_period_stats(252), "stats_3m": get_period_stats(63)
    }

    return {
        "ticker": ticker, "current_price": curr_price, "price": curr_price,
        "change_pct": ((curr_price - prev_close) / prev_close) * 100 if len(df) > 1 else 0,
        "today": today_metrics,
        "technical": {"rsi": rsi, "mfi": mfi, "macd": macd, "ma_stack": ma_stack, "pivots": pivots, "trend": trend, "performance": performance},
        "volume": volume, "fundamentals": fundamentals,
        "chart_data": chart_data[['timestamp', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records'),
        "history": chart_data.tail(10)[['date_str', 'open', 'high', 'low', 'close', 'volume']].to_dict(orient='records')
    }
