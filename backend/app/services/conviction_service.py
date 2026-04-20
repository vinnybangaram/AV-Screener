import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.conviction import StockConvictionScore
from app.services import regime_service, market_service

def calculate_conviction_score(symbol: str, db: Session = None, save: bool = False) -> Dict[str, Any]:
    """
    AVE-Scoring Engine: Generates 0-100 score for a given stock.
    """
    try:
        yf_sym = f"{symbol}.NS" if not (symbol.endswith(".NS") or symbol.endswith(".BO")) else symbol
        data = yf.download(yf_sym, period="250d", interval="1d", progress=False, timeout=10)
        
        if data.empty or len(data) < 50:
            return None

        # Prepare Data - Robust extraction
        def get_series(df, col):
            if col in df.columns:
                s = df[col]
                if isinstance(s, pd.DataFrame):
                    return s.iloc[:, 0]
                return s
            return None

        close = get_series(data, 'Close')
        high = get_series(data, 'High')
        low = get_series(data, 'Low')
        vol = get_series(data, 'Volume')
        
        if close is None or len(close) < 50:
            return None

        # Force to float scalars for comparisons
        curr = float(close.iloc[-1])
        prev_close = float(close.iloc[-2])
        
        # ── 1. Trend Score (25%) ──
        sma20 = float(close.rolling(20).mean().iloc[-1])
        sma50 = float(close.rolling(50).mean().iloc[-1])
        sma200 = float(close.rolling(200).mean().iloc[-1])
        
        t_score = 0
        if curr > sma20: t_score += 30
        if curr > sma50: t_score += 30
        if curr > sma200: t_score += 40
        if sma20 > sma50 > sma200: t_score = min(100, t_score + 10)

        # ── 2. Momentum Score (20%) ──
        ret5 = float((curr / close.iloc[-5] - 1) * 100)
        ret20 = float((curr / close.iloc[-20] - 1) * 100)
        
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = float(100 - (100 / (1 + rs.iloc[-1])))
        
        m_score = 50 
        if ret5 > 0: m_score += 10
        if ret20 > 5: m_score += 20
        if 40 < rsi < 70: m_score += 20
        if rsi > 70: m_score += 10 
        m_score = min(100, m_score)

        # ── 3. Volume Confirmation (15%) ──
        avg_vol = float(vol.rolling(20).mean().iloc[-1])
        curr_vol = float(vol.iloc[-1])
        v_score = min(100, int((curr_vol / avg_vol) * 100) if avg_vol > 0 else 50)
        if curr > prev_close and curr_vol > avg_vol: v_score = min(100, v_score + 20)

        # ── 4. Relative Strength (15%) ──
        nifty_df = yf.download("^NSEI", period="50d", interval="1d", progress=False)
        nifty = get_series(nifty_df, 'Close')
        stock_ret = float(close.tail(20).pct_change().sum())
        nifty_ret = float(nifty.tail(20).pct_change().sum())
        rs_score = 50 + (stock_ret - nifty_ret) * 500
        rs_score = max(0, min(100, rs_score))

        # ── 5. Risk Score (15%) ──
        # Lower ATR % = Higher Score
        atr = (high - low).rolling(14).mean().iloc[-1]
        atr_pct = (atr / curr) * 100
        risk_score = max(0, min(100, 100 - (atr_pct * 20))) 
        
        # ── 6. Regime Alignment (10%) ──
        regime = regime_service.calculate_current_regime()
        regime_code = regime.get("regime_code", "R4")
        g_score = 50 # Neutral
        if regime_code in ["R1", "R2"] and t_score > 70: g_score = 90
        if regime_code in ["R6", "R7"]: g_score = 30
        
        # FINAL WEIGHING
        final_score = (
            (t_score * 0.25) +
            (m_score * 0.20) +
            (v_score * 0.15) +
            (rs_score * 0.15) +
            (risk_score * 0.15) +
            (g_score * 0.10)
        )

        rating = _get_rating_label(final_score)
        
        result = {
            "symbol": symbol,
            "score": round(final_score, 1),
            "rating": rating,
            "trend": "Strong Uptrend" if t_score > 80 else "Uptrend" if t_score > 50 else "Weak/Down",
            "risk": "Low" if risk_score > 80 else "Medium" if risk_score > 50 else "High",
            "entry_zone": "Favorable" if m_score < 75 and t_score > 60 else "Wait" if m_score > 85 else "Caution",
            "timeframe": "Swing / Positional",
            "scores": {
                "trend": int(t_score),
                "momentum": int(m_score),
                "volume": int(v_score),
                "rs": int(rs_score),
                "risk": int(risk_score),
                "regime": int(g_score)
            },
            "summary": f"{rating} detected with {result_to_text(t_score, m_score)} behavior."
        }

        if save and db:
            snapshot = StockConvictionScore(
                symbol=symbol,
                score=result["score"],
                rating=result["rating"],
                trend_score=t_score,
                momentum_score=m_score,
                volume_score=v_score,
                relative_strength_score=rs_score,
                risk_score=risk_score,
                regime_score=g_score,
                entry_zone=result["entry_zone"],
                timeframe=result["timeframe"],
                summary_text=result["summary"]
            )
            db.add(snapshot)
            db.commit()

        return result

    except Exception as e:
        print(f"[Conviction] Error for {symbol}: {e}")
        return None

def _get_rating_label(score):
    if score >= 90: return "Elite Conviction"
    if score >= 80: return "Strong Buy Setup"
    if score >= 70: return "Watchlist Buy"
    if score >= 60: return "Neutral Positive"
    if score >= 40: return "Mixed Signals"
    if score >= 20: return "Weak Structure"
    return "High Risk / Breakdown"

def result_to_text(t, m):
    if t > 80 and m > 80: return "explosive trend"
    if t > 80: return "stable trend"
    if m > 80: return "high-velocity momentum"
    return "neutral"

def get_top_conviction_stocks(db: Session, limit: int = 20):
    # Try to get scores from last 24h first
    cutoff = datetime.utcnow() - timedelta(days=1)
    results = db.query(StockConvictionScore).filter(StockConvictionScore.created_at >= cutoff).order_by(StockConvictionScore.score.desc()).limit(limit).all()
    
    # If no recent scores, return most recent ones regardless of date
    if not results:
        results = db.query(StockConvictionScore).order_by(StockConvictionScore.created_at.desc(), StockConvictionScore.score.desc()).limit(limit).all()
        
    return results

def get_conviction_history(db: Session, symbol: str, days: int = 30):
    start = datetime.utcnow() - timedelta(days=days)
    return db.query(StockConvictionScore).filter(
        StockConvictionScore.symbol == symbol,
        StockConvictionScore.created_at >= start
    ).order_by(StockConvictionScore.created_at.asc()).all()
