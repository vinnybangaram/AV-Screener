import yfinance as yf
import pandas as pd

ticker = "^NSEI"
try:
    print(f"Downloading data for {ticker}...")
    df = yf.download(ticker, period="5d", interval="5m", auto_adjust=True, progress=False)
    print(f"Dataframe empty: {df.empty}")
    if not df.empty:
        print(f"Last 5 rows:\n{df.tail()}")
        print(f"Shape: {df.shape}")
    else:
        print("No data returned from yfinance.")
except Exception as e:
    print(f"Error: {e}")
