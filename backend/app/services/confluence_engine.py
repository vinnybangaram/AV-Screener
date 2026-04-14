import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.stock_analysis_service import get_full_analysis
from app.services.market_service import get_market_context
from app.services.news_service import get_stock_news
from app.services.forecast_engine import engine as forecast_engine

class ConfluenceEngine:
    """
    Weighted scoring engine that converts multiple market signals into a 0-100 score.
    Buckets: Trend (25%), Momentum (20%), Volume (15%), Risk (15%), Context (10%), Sentiment (15%).
    """

    def generate_score(self, symbol: str) -> Dict[str, Any]:
        # 1. Fetch data from existing layers
        try:
            analysis_data = get_full_analysis(symbol)
            if not analysis_data:
                raise ValueError(f"No analysis data found for {symbol}")
            
            market_context = get_market_context()
            news_data = get_stock_news(symbol)
            try:
                forecast_data = forecast_engine.generate_forecast(symbol, "30D")
            except:
                forecast_data = None
        except Exception as e:
            print(f"[Confluence] Data fetch failed: {e}")
            raise

        # Extract components
        tech = analysis_data['technical']
        vol_data = analysis_data['volume']
        price = analysis_data['price']
        
        drivers = []
        warnings = []

        # --- Layer 1: Trend Score (25%) ---
        trend_score = 0
        ma_stack = tech['ma_stack']
        sma20 = ma_stack['sma']['20']
        sma50 = ma_stack['sma']['50']
        sma200 = ma_stack['sma']['200']
        
        if price > sma20: trend_score += 6
        if price > sma50: trend_score += 7
        if price > sma200: trend_score += 6
        if sma20 > sma50: trend_score += 6
        
        if trend_score >= 18:
            drivers.append("Strong multi-timeframe uptrend")
        elif trend_score < 10:
            warnings.append("Price below major moving averages")

        # --- Layer 2: Momentum Score (20%) ---
        mom_score = 0
        rsi = tech['rsi']
        macd = tech['macd']
        
        # RSI health (40-70 range is constructive)
        if 45 <= rsi <= 65: mom_score += 8
        elif 65 < rsi <= 75: mom_score += 5 # Warning: Getting overbought
        elif 30 <= rsi < 45: mom_score += 4
        
        # MACD crossover
        if macd['status'] == "Bullish": mom_score += 12
        
        if mom_score >= 15:
            drivers.append("Bullish momentum crossover confirmed")
        if rsi > 70:
            warnings.append("RSI indicating overbought conditions")
        elif rsi < 30:
            warnings.append("RSI in oversold territory - high risk")

        # --- Layer 3: Volume Score (15%) ---
        volume_score = 0
        vol_ratio = vol_data['ratio']
        
        if vol_ratio > 1.5: volume_score += 15
        elif vol_ratio > 1.0: volume_score += 10
        elif vol_ratio > 0.8: volume_score += 5
        
        if vol_ratio > 1.5:
            drivers.append("High relative volume participation")
        elif vol_ratio < 0.5:
            warnings.append("Low volume confirmation")

        # --- Layer 4: Risk Score (15%) - Inverse logic ---
        # Starts at 15, deduct based on risks
        risk_score_base = 15
        
        # Volatility risk
        # We'll use day's high-low range as a proxy for intraday risk
        low_price = analysis_data['today'].get('low', 1)
        if low_price > 0:
            day_range_pct = (analysis_data['today'].get('high', price) - low_price) / low_price * 100
            if day_range_pct > 5: risk_score_base -= 5
            elif day_range_pct > 3: risk_score_base -= 2
        
        # Structural risk (Price far from support)
        pivot = tech['pivots'].get('pivot', price)
        if pivot > 0 and price > pivot * 1.10: # 10% above pivot
            risk_score_base -= 5
            warnings.append("Price significantly extended from support")
            
        risk_score = max(0, risk_score_base)
        if risk_score > 10:
            drivers.append("Stable price structure / Low risk profile")
        elif risk_score < 5:
            warnings.append("High volatility / Extension risk")

        # --- Layer 5: Market Context Score (10%) ---
        context_score = 0
        if market_context['trend'] == "Bullish": context_score += 10
        elif market_context['trend'] == "Neutral": context_score += 5
        
        if market_context['change_pct'] > 1.0:
            drivers.append("Strong overall market sentiment")
        elif market_context['change_pct'] < -1.0:
            warnings.append("Fighting broad market weakness")

        # --- Layer 6: Sentiment / Catalyst (15%) ---
        sent_score = 0
        # News based sentiment
        bull_news = [n for n in news_data if n['sentiment'] == 'Bullish']
        bear_news = [n for n in news_data if n['sentiment'] == 'Bearish']
        
        if len(bull_news) > len(bear_news): sent_score += 7
        
        # 0-100 logic integration from forecast
        if forecast_data:
            bull_prob = forecast_data['scenarios']['bullish']['probability']
            if bull_prob > 50: sent_score += 8
            elif bull_prob > 40: sent_score += 4
            
        if sent_score >= 10:
            drivers.append("Positive news catalyst & high probability setup")
        elif len(bear_news) > 0 and len(bull_news) == 0:
            warnings.append("Negative news sentiment detected")

        # Final Total
        total_score = trend_score + mom_score + volume_score + risk_score + context_score + sent_score
        total_score = min(100, max(0, int(total_score)))
        
        # Determine Label
        label = "Neutral"
        if total_score >= 85: label = "Elite Setup"
        elif total_score >= 70: label = "Strong Bullish"
        elif total_score >= 55: label = "Constructive"
        elif total_score >= 40: label = "Neutral"
        elif total_score >= 25: label = "Weak"
        else: label = "Avoid / High Risk"

        return {
            "symbol": symbol,
            "score": total_score,
            "label": label,
            "breakdown": {
                "trend": trend_score,
                "momentum": mom_score,
                "volume": volume_score,
                "risk": risk_score,
                "marketContext": context_score,
                "sentiment": sent_score
            },
            "drivers": drivers[:3],
            "warnings": warnings[:3],
            "updatedAt": datetime.now().isoformat()
        }

engine = ConfluenceEngine()
