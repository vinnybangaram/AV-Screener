import yfinance as yf
import pandas as pd

symbols = ["RELIANCE.NS", "TCS.NS"]
data = yf.download(symbols, period="2d", interval="1d")
print("Columns:", data.columns)
if not data.empty:
    print("Head:\n", data.head())
    if 'Close' in data:
        print("Close head:\n", data['Close'].head())
