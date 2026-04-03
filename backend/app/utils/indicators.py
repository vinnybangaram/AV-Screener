import pandas as pd
import numpy as np

def calculate_rsi(data: pd.Series, window=14) -> pd.Series:
    delta = data.diff()
    up, down = delta.copy(), delta.copy()
    up[up < 0] = 0
    down[down > 0] = 0

    roll_up1 = up.ewm(span=window, min_periods=window).mean()
    roll_down1 = down.abs().ewm(span=window, min_periods=window).mean()

    RS1 = roll_up1 / roll_down1
    RSI1 = 100.0 - (100.0 / (1.0 + RS1))
    return RSI1

def calculate_macd(data: pd.Series, slow=26, fast=12, signal=9):
    exp1 = data.ewm(span=fast, adjust=False).mean()
    exp2 = data.ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd, signal_line

def calculate_sma(data: pd.Series, window=50):
    return data.rolling(window=window).mean()

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, window=14):
    tr1 = (high - low).abs()
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=window).mean()
    return atr
