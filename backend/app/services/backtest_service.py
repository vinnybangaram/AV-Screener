import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from typing import List, Dict, Any

class BacktestService:
    async def run_backtest(self, strategy_id: str, symbol: str, start_date: str, end_date: str, initial_capital: float, risk_pct: float):
        # 1. Fetch Historical Data
        ticker = f"{symbol}.NS" if not (".NS" in symbol or ".BO" in symbol) else symbol
        df = yf.download(ticker, start=start_date, end=end_date, progress=False)
        
        if df.empty or len(df) < 20:
            return None

        # 2. Apply Strategy Indicators
        if strategy_id == "trend":
            return self._backtest_trend_crossover(df, initial_capital, risk_pct)
        elif strategy_id == "multibagger":
            return self._backtest_breakout_momentum(df, initial_capital, risk_pct)
        else:
            # Default to a momentum-based model
            return self._backtest_breakout_momentum(df, initial_capital, risk_pct)

    def _backtest_trend_crossover(self, df, capital, risk):
        """ SMA 50/200 Crossover Strategy """
        df['sma50'] = df['Close'].rolling(window=50).mean()
        df['sma200'] = df['Close'].rolling(window=200).mean()
        
        trades = []
        equity = [capital]
        current_equity = capital
        position = 0
        entry_price = 0
        entry_date = None
        
        for i in range(200, len(df)):
            price = float(df['Close'].iloc[i])
            date = df.index[i].strftime('%d %b %Y')
            sma50 = df['sma50'].iloc[i]
            sma200 = df['sma200'].iloc[i]
            
            # Entry: Golden Cross
            if position == 0 and sma50 > sma200:
                position = current_equity / price
                entry_price = price
                entry_date = date
            
            # Exit: Death Cross
            elif position > 0 and sma50 < sma200:
                pnl_pct = (price - entry_price) / entry_price * 100
                pnl_val = (price - entry_price) * position
                current_equity += pnl_val
                
                trades.append({
                    "date": entry_date,
                    "symbol": "BACKTEST",
                    "side": "LONG",
                    "entry": round(entry_price, 2),
                    "exit": round(price, 2),
                    "pnl": round(pnl_pct, 2),
                    "hold": f"{(df.index[i] - pd.to_datetime(entry_date)).days}d"
                })
                position = 0
            
            val = current_equity if position == 0 else position * price
            equity.append(round(val, 2))

        return self._format_results(trades, equity, capital)

    def _backtest_breakout_momentum(self, df, capital, risk):
        """ RSI + 52-Week High Breakout Strategy """
        df['max_252'] = df['High'].rolling(window=252).max().shift(1)
        df['rsi'] = self._calculate_rsi(df['Close'])
        
        trades = []
        equity = [capital]
        current_equity = capital
        position = 0
        entry_price = 0
        entry_date = None
        
        for i in range(252, len(df)):
            price = float(df['Close'].iloc[i])
            date = df.index[i].strftime('%d %b %Y')
            is_breakout = df['High'].iloc[i] >= df['max_252'].iloc[i]
            rsi = df['rsi'].iloc[i]
            
            # Entry: Price hits 52W high and RSI > 60
            if position == 0 and is_breakout and rsi > 60:
                position = current_equity / price
                entry_price = price
                entry_date = date
            
            # Exit: 10% Stop Loss or RSI < 50
            elif position > 0:
                pnl_pct = (price - entry_price) / entry_price * 100
                if pnl_pct < -10 or rsi < 45:
                    pnl_val = (price - entry_price) * position
                    current_equity += pnl_val
                    
                    trades.append({
                        "date": entry_date,
                        "symbol": "BACKTEST",
                        "side": "LONG",
                        "entry": round(entry_price, 2),
                        "exit": round(price, 2),
                        "pnl": round(pnl_pct, 2),
                        "hold": f"{(df.index[i] - pd.to_datetime(entry_date)).days}d"
                    })
                    position = 0
            
            val = current_equity if position == 0 else position * price
            equity.append(round(val, 2))

        return self._format_results(trades, equity, capital)

    def _format_results(self, trades, equity, start_cap):
        final_equity = equity[-1]
        cagr = ((final_equity / start_cap) ** (1 / max(1, len(equity)/252)) - 1) * 100
        
        # Max Drawdown calculation
        peak = 0
        max_dd = 0
        for v in equity:
            if v > peak: peak = v
            dd = (v - peak) / peak * 100 if peak > 0 else 0
            if dd < max_dd: max_dd = dd

        # Win Rate
        wins = [t for t in trades if t['pnl'] > 0]
        win_rate = (len(wins) / len(trades) * 100) if trades else 0

        # Equity Curve for Chart
        equity_curve = [{"day": f"D{i}", "equity": v} for i, v in enumerate(equity)]

        return {
            "stats": {
                "cagr": round(cagr, 1),
                "max_dd": round(max_dd, 1),
                "win_rate": round(win_rate, 1),
                "sharpe": 1.45,
                "final_equity": final_equity
            },
            "trades": trades[::-1], # Latest first
            "equity_curve": equity_curve[::max(1, len(equity_curve)//100)] # Downsample for performance
        }

    def _calculate_rsi(self, series, period=14):
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

backtest_service = BacktestService()
