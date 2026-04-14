import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.data.yahoo_fetcher import fetch_stock_data
from app.utils.format import format_symbol
from app.services.market_service import get_market_context

class ForecastEngine:
    """
    Deterministic hybrid model for generating probability-based stock forecasts.
    Uses trend detection, volatility modeling, and market context.
    """

    def __init__(self):
        self.horizons = {
            "7D": 7,
            "30D": 30,
            "90D": 90
        }

    def _calculate_volatility(self, df: pd.DataFrame, window: int = 20) -> float:
        """Calculates annualized volatility based on log returns."""
        if len(df) < window:
            return 0.15  # Default 15% if not enough data
        
        returns = np.log(df['Close'] / df['Close'].shift(1))
        vol = returns.rolling(window=window).std() * np.sqrt(252)
        return float(vol.iloc[-1]) if not pd.isna(vol.iloc[-1]) else 0.15

    def _calculate_trend_strength(self, df: pd.DataFrame) -> float:
        """
        Calculates trend strength from 0 to 1.
        1.0 means strong bullish trend, -1.0 means strong bearish trend.
        Uses MAs and price slope.
        """
        if len(df) < 50:
            return 0.0

        curr_price = df['Close'].iloc[-1]
        sma20 = df['Close'].rolling(window=20).mean().iloc[-1]
        sma50 = df['Close'].rolling(window=50).mean().iloc[-1]
        
        # Trend based on MAs
        score = 0
        if curr_price > sma20: score += 0.25
        if curr_price > sma50: score += 0.25
        if sma20 > sma50: score += 0.25
        
        # Price slope (last 10 days)
        y = df['Close'].tail(10).values
        x = np.arange(len(y))
        slope = np.polyfit(x, y, 1)[0]
        
        if slope > 0: score += 0.25
        
        # Normalize/Adjust (simple linear scale)
        # If all bullish, score is 1.0. If all bearish, score is 0.
        # Let's adjust it to range [-1, 1]
        
        # Recalculate for Bearish too
        bear_score = 0
        if curr_price < sma20: bear_score += 0.25
        if curr_price < sma50: bear_score += 0.25
        if sma20 < sma50: bear_score += 0.25
        if slope < 0: bear_score += 0.25
        
        return score - bear_score

    def generate_forecast(self, symbol: str, horizon: str = "30D") -> Dict[str, Any]:
        """Generates a structured probability forecast for a given stock."""
        ticker = format_symbol(symbol)
        df = fetch_stock_data(ticker, period="1y")
        
        if df is None or df.empty:
            raise ValueError(f"Could not fetch data for {symbol}")

        curr_price = float(df['Close'].iloc[-1])
        volatility = self._calculate_volatility(df)
        trend_strength = self._calculate_trend_strength(df)
        market_context = get_market_context()
        
        horizon_days = self.horizons.get(horizon, 30)
        
        # 1. Calculate Expected Move (1 Standard Deviation)
        # Expected Move = Price * Volatility * sqrt(Days / 252)
        expected_move_pct = volatility * np.sqrt(horizon_days / 252)
        expected_move_abs = curr_price * expected_move_pct
        
        # 2. Adjust Probabilities based on Trend and Market
        # Base probabilities for Neutral/Sideways
        p_bullish = 33.3
        p_neutral = 33.4
        p_bearish = 33.3
        
        # Adjust by trend strength (trend_strength is between -1 and 1)
        # Shift up to 20% based on trend
        p_bullish += trend_strength * 20
        p_bearish -= trend_strength * 20
        
        # Adjust by market context
        if market_context['trend'] == "Bullish":
            p_bullish += 5
            p_bearish -= 5
        elif market_context['trend'] == "Bearish":
            p_bullish -= 5
            p_bearish += 5
            
        # Ensure Neutral stays healthy unless trend is extreme
        if abs(trend_strength) > 0.7:
            p_neutral -= 10
            if trend_strength > 0: p_bullish += 10
            else: p_bearish += 10
            
        # Clip and Normalize to 100%
        p_bullish = max(5, min(90, p_bullish))
        p_bearish = max(5, min(90, p_bearish))
        p_neutral = 100 - p_bullish - p_bearish
        
        if p_neutral < 5: # Safety check
            diff = 5 - p_neutral
            if p_bullish > p_bearish: p_bullish -= diff
            else: p_bearish -= diff
            p_neutral = 5

        # 3. Define Ranges
        # Bullish Range: [Current + 0.2*Move, Current + 1.2*Move]
        # Neutral Range: [Current - 0.3*Move, Current + 0.3*Move]
        # Bearish Range: [Current - 1.2*Move, Current - 0.2*Move]
        
        bull_lower = curr_price + (0.1 * expected_move_abs)
        bull_upper = curr_price + (1.2 * expected_move_abs)
        
        neu_lower = curr_price - (0.2 * expected_move_abs)
        neu_upper = curr_price + (0.2 * expected_move_abs)
        
        bear_lower = curr_price - (1.2 * expected_move_abs)
        bear_upper = curr_price - (0.1 * expected_move_abs)
        
        # 4. Confidence Score
        confidence = "Medium"
        if abs(trend_strength) > 0.6 and market_context['volatility'] != "High":
            confidence = "High"
        elif market_context['volatility'] == "High" or abs(trend_strength) < 0.2:
            confidence = "Low"
            
        # 5. Reasoning
        reasoning = []
        if trend_strength > 0.4: reasoning.append(f"Strong bullish momentum in {symbol}")
        elif trend_strength < -0.4: reasoning.append(f"Significant bearish pressure detected")
        else: reasoning.append(f"Stock is currently in a consolidation phase")
        
        if market_context['trend'] == "Bullish": reasoning.append("Overall market sentiment is supportive")
        elif market_context['trend'] == "Bearish": reasoning.append("Broad market weakness may act as a drag")
        
        if volatility > 0.4: reasoning.append("High volatility suggests a wider range of possible outcomes")
        else: reasoning.append("Stable volatility levels provide higher forecast reliability")

        return {
            "symbol": symbol,
            "horizon": horizon,
            "currentPrice": round(curr_price, 2),
            "confidence": confidence,
            "scenarios": {
                "bullish": {
                    "probability": round(p_bullish),
                    "range": f"{round(bull_lower, 2)} - {round(bull_upper, 2)}"
                },
                "neutral": {
                    "probability": round(p_neutral),
                    "range": f"{round(neu_lower, 2)} - {round(neu_upper, 2)}"
                },
                "bearish": {
                    "probability": round(p_bearish),
                    "range": f"{round(bear_lower, 2)} - {round(bear_upper, 2)}"
                }
            },
            "reasoning": reasoning[:3],
            "generatedAt": datetime.now().isoformat()
        }

engine = ForecastEngine()
