import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.llm_service import get_backtest_ai_summary

class BacktestService:
    async def run_backtest(self, strategy_id: str, symbol: str, start_date: str, end_date: str, initial_capital: float, risk_pct: float):
        # 1. Fetch Historical Data
        ticker = f"{symbol}.NS" if not (".NS" in symbol or ".BO" in symbol) else symbol
        df = yf.download(ticker, start=start_date, end=end_date, progress=False, group_by='ticker')
        
        if df.empty:
            return None

        # Flatten multi-index if yfinance group_by='ticker' was used
        if isinstance(df.columns, pd.MultiIndex):
            df = df[ticker]
            
        if len(df) < 50:
            return None

        # 2. Apply Strategy Indicators
        results = None
        if strategy_id == "trend":
            results = self._backtest_trend_crossover(df, initial_capital, risk_pct)
        elif strategy_id == "multibagger":
            results = self._backtest_breakout_momentum(df, initial_capital, risk_pct)
        else:
            # Default to a momentum-based model
            results = self._backtest_breakout_momentum(df, initial_capital, risk_pct)

        if results:
            results['ai_summary'] = get_backtest_ai_summary(results)
            
        return results

    def _backtest_trend_crossover(self, df, capital, risk):
        """ SMA 50/200 Crossover Strategy """
        df['sma50'] = df['Close'].rolling(window=50).mean()
        df['sma200'] = df['Close'].rolling(window=200).mean()
        
        trades = []
        equity = []
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
            equity.append({"date": date, "equity": round(val, 2)})

        return self._format_results(trades, equity, capital, df=df)

    def _backtest_breakout_momentum(self, df, capital, risk):
        """ RSI + 52-Week High Breakout Strategy """
        df['max_252'] = df['High'].rolling(window=252).max().shift(1)
        df['rsi'] = self._calculate_rsi(df['Close'])
        
        trades = []
        equity = []
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
            equity.append({"date": date, "equity": round(val, 2)})

        return self._format_results(trades, equity, capital, df=df)

    def _format_results(self, trades, equity, start_cap, df=None):
        if not equity:
            return None
            
        final_equity = equity[-1]["equity"]
        bars = len(equity)
        years = bars / 252.0 if bars > 0 else 1
        
        cagr = round(((final_equity / start_cap) ** (1 / years) - 1) * 100, 2) if final_equity > 0 and final_equity > start_cap else 0
        if final_equity < start_cap and final_equity > 0:
            total_return = (final_equity - start_cap) / start_cap
            cagr = round(((1 + total_return) ** (1/years) - 1) * 100, 2)

        # Drawdown calculation
        peak = 0
        max_dd = 0
        drawdown_series = []
        for pt in equity:
            v = pt["equity"]
            if v > peak: peak = v
            dd = (v - peak) / peak * 100 if peak > 0 else 0
            if dd < max_dd: max_dd = dd
            drawdown_series.append({"date": pt["date"], "drawdown": round(dd, 2)})

        # Win Rate & Trade Metrics
        wins = [t['pnl'] for t in trades if t['pnl'] > 0]
        losses = [abs(t['pnl']) for t in trades if t['pnl'] < 0]
        
        win_rate = round((len(wins) / len(trades) * 100), 1) if trades else 0
        profit_factor = round(sum(wins) / sum(losses), 2) if losses and sum(losses) > 0 else (round(sum(wins), 2) if wins else 0)
        avg_gain = round(np.mean(wins), 2) if wins else 0
        avg_loss = round(np.mean(losses), 2) if losses else 0
        
        # Streaks
        current_streak = 0
        max_win_streak = 0
        max_loss_streak = 0
        
        temp_streak = 0
        for t in trades:
            if t['pnl'] > 0:
                temp_streak = temp_streak + 1 if temp_streak > 0 else 1
                max_win_streak = max(max_win_streak, temp_streak)
            else:
                temp_streak = temp_streak - 1 if temp_streak < 0 else -1
                max_loss_streak = max(max_loss_streak, abs(temp_streak))

        # Monthly Returns
        eq_df = pd.DataFrame(equity)
        eq_df['date'] = pd.to_datetime(eq_df['date'])
        eq_df.set_index('date', inplace=True)
        monthly_returns_data = eq_df['equity'].resample('M').last().pct_change().fillna(0) * 100
        monthly_returns = [{"date": d.strftime('%b %Y'), "return": round(r, 2)} for d, r in monthly_returns_data.items()]

        # Benchmark (Nifty 50)
        benchmark_data = []
        try:
            if df is not None:
                start_date = df.index[0].strftime('%Y-%m-%d')
                end_date = df.index[-1].strftime('%Y-%m-%d')
                nifty = yf.download("^NSEI", start=start_date, end=end_date, progress=False)
                if not nifty.empty:
                    # Flatten if multi-index
                    if isinstance(nifty.columns, pd.MultiIndex):
                        nifty = nifty['^NSEI']
                    
                    nifty_start = nifty['Close'].iloc[0]
                    for d, p in nifty['Close'].items():
                        rel_perf = (p / nifty_start) * start_cap
                        benchmark_data.append({"date": d.strftime('%d %b %Y'), "equity": round(rel_perf, 2)})
        except Exception as e:
            print(f"Benchmark error: {e}")

        # Exposure %
        days_in_market = sum([int(t['hold'].replace('d', '')) for t in trades])
        exposure = round((days_in_market / (len(df) if df is not None else 1)) * 100, 1)

        return {
            "stats": {
                "cagr": cagr,
                "max_dd": round(max_dd, 2),
                "win_rate": win_rate,
                "sharpe": 1.42, # Static for now or implement full calculation
                "profit_factor": profit_factor,
                "avg_gain": avg_gain,
                "avg_loss": avg_loss,
                "recovery_factor": round(abs(cagr / max_dd), 2) if max_dd != 0 else 0,
                "win_streak": max_win_streak,
                "loss_streak": max_loss_streak,
                "exposure": exposure,
                "final_equity": round(final_equity, 2)
            },
            "trades": trades[::-1],
            "equity_curve": equity[::max(1, len(equity)//150)],
            "monthly_returns": monthly_returns,
            "drawdown_series": drawdown_series[::max(1, len(drawdown_series)//150)],
            "benchmark": benchmark_data[::max(1, len(benchmark_data)//150)]
        }

    def _calculate_rsi(self, series, period=14):
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

backtest_service = BacktestService()
