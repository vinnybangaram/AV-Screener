import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.stock_analysis_service import get_full_analysis
from app.services.confluence_engine import engine as confluence_engine
from app.utils.format import format_symbol

class TradeSetupEngine:
    """
    Logic engine to generate actionable trade setups based on market structure.
    Setup Types: Breakout, Pullback, Reversal, Avoid.
    """

    def generate_setup(self, symbol: str) -> Dict[str, Any]:
        # 1. Fetch analysis and confluence data
        try:
            analysis_data = get_full_analysis(symbol)
            if not analysis_data:
                raise ValueError(f"No analysis data found for {symbol}")
            
            confluence_data = confluence_engine.generate_score(symbol)
        except Exception as e:
            print(f"[TradeSetup] Data fetch failed: {e}")
            raise

        price = analysis_data['price']
        tech = analysis_data['technical']
        pivots = tech['pivots']
        ma_stack = tech['ma_stack']
        conf_score = confluence_data['score']
        
        # Calculate ATR approximation (using last 14 days high-low range)
        # In a real system, we'd use true ATR, but this is a good deterministic proxy
        # using the today's high/low and historical volatility
        volatility = analysis_data.get('volatility', {}).get('current', 0.02) # Default 2%
        atr_proxy = price * 0.015 # 1.5% as base ATR proxy
        
        setup_type = "Avoid"
        status = "Avoid"
        confidence = "Low"
        reasons = []
        warnings = []
        
        # --- LOGIC: Setup Type Detection ---
        
        # 1. Pullback Check
        # Conditions: Bullish trend (Score > 50), and price near MA20 or S1
        sma20 = ma_stack['sma']['20']
        sma50 = ma_stack['sma']['50']
        s1 = pivots.get('s1', 0)
        r1 = pivots.get('r1', 0)
        
        is_uptrend = price > sma50 and sma20 > sma50
        
        if is_uptrend and (abs(price - sma20) / price < 0.02 or abs(price - s1) / price < 0.02):
            setup_type = "Pullback"
            status = "Valid"
            reasons.append("Price retraced to key support zone in an uptrend")
            reasons.append("Trend remains structurally intact")
        
        # 2. Breakout Check
        # Conditions: Strong confluence, rising volume, price near R1/R2
        elif conf_score > 65 and analysis_data['volume']['ratio'] > 1.2:
            if abs(price - r1) / price < 0.02 or price > r1:
                setup_type = "Breakout"
                status = "Valid"
                reasons.append("High volume breakout/continuation signal")
                reasons.append("Strong signal confluence supports the move")
        
        # 3. Reversal Check
        # Conditions: Oversold RSI, forming base near S2 or S3
        elif tech['rsi'] < 35:
            s2 = pivots.get('s2', 0)
            if abs(price - s2) / price < 0.03:
                setup_type = "Reversal"
                status = "Watchlist"
                reasons.append("Oversold conditions near major pivot support")
                reasons.append("Potential exhaustive selling; wait for recovery pulse")
        
        # --- Logic: Entry, SL, Targets ---
        
        if setup_type == "Avoid" or conf_score < 40:
            setup_type = "Avoid"
            status = "Watchlist" if conf_score > 30 else "Avoid"
            confidence = "Low"
            entry_zone = "N/A"
            sl = 0
            t1 = 0
            t2 = 0
            rr = "0"
            reasons.append("Market structure too choppy for low-risk entry")
            warnings.append("Low signal confluence detected")
        else:
            # Entry Zone: [Price - 0.2*ATR, Price + 0.2*ATR] or slightly optimized
            entry_min = price * 0.99
            entry_max = price * 1.01
            entry_zone = f"{round(entry_min, 2)} - {round(entry_max, 2)}"
            
            # Stop Loss: 
            # Pullback: Below S1 or SMA20
            # Breakout: Below R1 or recent low
            if setup_type == "Breakout":
                sl = price - (atr_proxy * 1.5)
                t1 = price + (atr_proxy * 2)
                t2 = price + (atr_proxy * 4)
            elif setup_type == "Pullback":
                sl = min(sma20, s1) * 0.985 # 1.5% buffer
                t1 = r1
                t2 = r1 + (atr_proxy * 2)
            else: # Reversal
                sl = pivots.get('s3', price * 0.95)
                t1 = pivots.get('pivot', price * 1.05)
                t2 = r1
                
            # Confidence logic
            if conf_score > 75: confidence = "High"
            elif conf_score > 55: confidence = "Medium"
            else: confidence = "Low"
            
            # Risk/Reward
            risk = abs(price - sl)
            reward = abs(t1 - price)
            
            if risk > 0:
                rr_val = round(reward / risk, 1)
                rr = f"1:{rr_val}"
                if rr_val < 1.4:
                    warnings.append("Risk/Reward ratio is suboptimal at current levels")
                    if status == "Valid": status = "Watchlist"
            else:
                rr = "1:1.5"

        # Final Formatting
        return {
            "symbol": symbol,
            "setupType": setup_type,
            "status": status,
            "confidence": confidence,
            "entryZone": entry_zone,
            "stopLoss": round(sl, 2),
            "targets": {
                "t1": round(t1, 2),
                "t2": round(t2, 2)
            },
            "riskReward": rr,
            "reasons": reasons[:3],
            "warnings": warnings[:3],
            "updatedAt": datetime.now().isoformat()
        }

engine = TradeSetupEngine()
