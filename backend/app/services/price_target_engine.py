import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.stock_analysis_service import get_full_analysis
from app.services.market_service import get_market_context
from app.services.forecast_engine import engine as forecast_engine
from app.services.confluence_engine import engine as confluence_engine
from app.services.trade_setup_engine import engine as setup_engine

class PriceTargetEngine:
    """
    Blended model engine for scenario-based price target consensus.
    Combines trend continuation, mean reversion, and volatility-based modeling.
    """

    def __init__(self):
        self.horizons = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "180d": 180
        }

    def _calculate_atr(self, df: pd.DataFrame, window: int = 14) -> float:
        """Calculates ATR or proxy for volatility scaling."""
        if len(df) < window: return df['Close'].iloc[-1] * 0.02
        high_low = df['High'] - df['Low']
        atr = high_low.rolling(window=window).mean().iloc[-1]
        return float(atr) if not pd.isna(atr) else df['Close'].iloc[-1] * 0.02

    def generate_targets(self, symbol: str) -> Dict[str, Any]:
        try:
            analysis_data = get_full_analysis(symbol)
            if not analysis_data: raise ValueError(f"No analysis data for {symbol}")
            
            market_context = get_market_context()
            conf_data = confluence_engine.generate_score(symbol)
            setup_data = setup_engine.generate_setup(symbol)
        except Exception as e:
            print(f"[PriceTarget] Data error: {e}")
            raise

        df = fetch_stock_data_fallback(symbol) # Internal helper to get OHLC
        curr_price = analysis_data['price']
        atr = self._calculate_atr(df)
        conf_score = conf_data['score']
        
        # Base Path logic
        # Trend continuation or mean reversion?
        ma50 = analysis_data['technical']['ma_stack']['sma']['50']
        dist_from_ma50 = (curr_price - ma50) / ma50
        
        # Scaling factor based on market regime
        regime_factor = 1.0
        if market_context['volatility'] == "High": regime_factor = 1.3
        elif market_context['trend'] == "Bearish": regime_factor = 0.8
        
        results = {}
        for h_key, h_days in self.horizons.items():
            # Volatility scaling: ATR * sqrt(time)
            scale = np.sqrt(h_days / 1) 
            h_move = atr * scale * regime_factor
            
            # 1. Base Case Calculation (Blended)
            # Drift based on trend strength
            trend_drift = (conf_score - 50) / 100 * h_move * 0.5
            base_mid = curr_price + trend_drift
            
            # Mean reversion pull (if significantly extended)
            if abs(dist_from_ma50) > 0.15:
                pull = (ma50 - curr_price) * (h_days / 180) # Slower pull
                base_mid += pull
                
            base_range = f"{round(base_mid - (0.2 * h_move), 2)}-{round(base_mid + (0.2 * h_move), 2)}"
            
            # 2. Bullish scenario (1.5 SD move up)
            bull_mid = curr_price + (1.2 * h_move) + trend_drift
            bull_range = f"{round(bull_mid - (0.15 * h_move), 2)}-{round(bull_mid + (0.25 * h_move), 2)}"
            
            # 3. Bearish scenario (1.2 SD move down)
            bear_mid = curr_price - (1.0 * h_move) + trend_drift
            bear_range = f"{round(bear_mid - (0.25 * h_move), 2)}-{round(bear_mid + (0.15 * h_move), 2)}"
            
            # Confidence per timeframe
            # Shorter timeframes have higher data quality; longer depend on trend stability
            h_confidence = "Medium"
            if h_days <= 30 and conf_score > 60: h_confidence = "High"
            elif h_days >= 90 and abs(conf_score - 50) < 10: h_confidence = "Low"
            
            results[h_key] = {
                "bearish": bear_range,
                "base": base_range,
                "bullish": bull_range,
                "expected": round(base_mid, 2),
                "confidence": h_confidence
            }

        # Context drivers
        drivers = []
        if conf_score > 70: drivers.append("Strong technical alignment")
        elif conf_score < 35: drivers.append("Weak structural support")
        else: drivers.append("Neutral signal confluence")
        
        if setup_data['status'] == "Valid": drivers.append(f"Active {setup_data['setupType']} setup identified")
        
        if market_context['trend'] == "Bullish": drivers.append("Market regime is supportive")
        
        return {
            "symbol": symbol,
            "currentPrice": curr_price,
            "targets": results,
            "drivers": drivers[:3],
            "warnings": ["Near-term volatility expected" if market_context['volatility'] == "High" else "Standard market variance"],
            "updatedAt": datetime.now().isoformat()
        }

def fetch_stock_data_fallback(symbol):
    from app.data.yahoo_fetcher import fetch_stock_data
    from app.utils.format import format_symbol
    return fetch_stock_data(format_symbol(symbol), period="1y")

engine = PriceTargetEngine()
