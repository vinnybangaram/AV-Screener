import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.market_regime import MarketRegimeSnapshot
from app.services import market_service
import json

REGIMES = {
    "R1": "Bull Accumulation",
    "R2": "Momentum Bull",
    "R3": "Overheated Rally",
    "R4": "Sideways Range",
    "R5": "Rotation Market",
    "R6": "Risk-Off Correction",
    "R7": "Panic Selloff",
    "R8": "Recovery Rebound"
}

def calculate_current_regime(db: Session = None) -> Dict[str, Any]:
    """
    Main engine that classifies the current market regime.
    """
    try:
        # 1. Fetch Index Data
        indices = ["^NSEI", "^NSEBANK", "^BSESN", "NIFTY_MIDCAP_100.NS", "NIFTY_SMALLCAP_100.NS"]
        # Midcap/Smallcap tickers might vary on YF, using common ones
        index_data = yf.download(indices, period="200d", interval="1d", progress=False, timeout=10)
        
        if index_data.empty:
            return _generate_fallback_regime()

        last_prices = index_data['Close'].iloc[-1]
        
        # ── 1. Trend Score (30%) ──
        # Price vs 20, 50, 200 DMA for Nifty
        nifty_close = index_data['Close']['^NSEI'].dropna()
        sma20 = nifty_close.rolling(20).mean().iloc[-1]
        sma50 = nifty_close.rolling(50).mean().iloc[-1]
        sma200 = nifty_close.rolling(200).mean().iloc[-1]
        curr_price = nifty_close.iloc[-1]
        
        trend_score = 0
        if curr_price > sma20: trend_score += 30
        if curr_price > sma50: trend_score += 30
        if curr_price > sma200: trend_score += 40
        
        # ── 2. Breadth Score (25%) ──
        # Advances/Declines from top movers as proxy + general trend
        movers = market_service.get_top_movers()
        gainers_count = len(movers.get("gainers", []))
        losers_count = len(movers.get("losers", []))
        breadth_ratio = gainers_count / (gainers_count + losers_count) if (gainers_count + losers_count) > 0 else 0.5
        breadth_score = int(breadth_ratio * 100)
        
        # ── 3. Volatility Score (15%) ──
        # India VIX proxy (using Nifty daily returns std)
        returns = nifty_close.pct_change(fill_method=None).dropna()
        annualized_vol = returns.tail(20).std() * (252**0.5)
        # Low vol is good for score (inverted)
        vol_score = max(0, min(100, 100 - (annualized_vol * 400))) 
        vol_label = "Low" if annualized_vol < 0.15 else "Moderate" if annualized_vol < 0.25 else "High"
        
        # ── 4. Rotation Score (15%) ──
        # Simple sector proxy using top movers
        # In a real app, we'd fetch Nifty Sector indices
        sectors = ["Financials", "IT", "Auto", "Pharma", "Infra", "Metals", "FMCG", "Energy"]
        rotation_score = 65 # Placeholder for now, ideally derived from sector relative strength
        
        # ── 5. Liquidity Score (15%) ──
        # Volume relative to 20-day avg
        nifty_vol = index_data['Volume']['^NSEI'].dropna()
        avg_vol = nifty_vol.tail(20).mean()
        curr_vol = nifty_vol.iloc[-1]
        liq_score = min(100, int((curr_vol / avg_vol) * 100)) if avg_vol > 0 else 70

        # FINAL CALCULATION
        final_score = (
            (trend_score * 0.30) +
            (breadth_score * 0.25) +
            (vol_score * 0.15) +
            (rotation_score * 0.15) +
            (liq_score * 0.15)
        )
        
        # REGIME CLASSIFICATION
        regime_code = "R4" # Default Sideways
        if final_score > 80:
            regime_code = "R3" if breadth_score > 85 else "R2"
        elif final_score > 60:
            regime_code = "R1" if trend_score > 70 else "R5"
        elif final_score < 30:
            regime_code = "R7" if vol_label == "High" else "R6"
        elif final_score < 45:
            regime_code = "R8" if nifty_close.iloc[-1] > nifty_close.iloc[-5] else "R6"

        result = {
            "regime": REGIMES[regime_code],
            "regime_code": regime_code,
            "confidence": int(abs(final_score - 50) * 1.5 + 40), # Dynamic confidence
            "trend_score": int(trend_score),
            "breadth_score": int(breadth_score),
            "volatility_score": int(vol_score),
            "rotation_score": int(rotation_score),
            "liquidity_score": int(liq_score),
            "volatility": vol_label,
            "leaders": ["Financials", "Auto", "Infra"] if final_score > 50 else ["Pharma", "FMCG"],
            "laggards": ["IT", "Metals"] if final_score > 50 else ["Auto", "Infra"],
            "summary": _generate_summary(regime_code, final_score, vol_label)
        }
        
        # Save to DB if provided
        if db:
            snapshot = MarketRegimeSnapshot(
                regime_code=regime_code,
                regime_name=REGIMES[regime_code],
                confidence=result["confidence"],
                trend_score=result["trend_score"],
                breadth_score=result["breadth_score"],
                volatility_score=result["volatility_score"],
                rotation_score=result["rotation_score"],
                liquidity_score=result["liquidity_score"],
                volatility_label=vol_label,
                top_sectors=result["leaders"],
                weak_sectors=result["laggards"],
                summary_text=result["summary"]
            )
            db.add(snapshot)
            db.commit()

        return result

    except Exception as e:
        print(f"[Regime] Engine error: {e}")
        return _generate_fallback_regime()

def _generate_summary(code, score, vol):
    if code == "R2": return "Primary trend is institutional momentum. Sector participation is broadening."
    if code == "R3": return "Euphoric levels detected. Breadth is extremely stretched. Trail SLs tightly."
    if code == "R7": return "Panic liquidations visible. High volatility expansion. Cash is king."
    if code == "R4": return "Lack of directional conviction. Market searching for new triggers."
    return "Market is transitioning between phases. Watch for sector rotation."

def _generate_fallback_regime():
    return {
        "regime": "Momentum Bull",
        "regime_code": "R2",
        "confidence": 78,
        "trend_score": 85,
        "breadth_score": 72,
        "volatility_score": 90,
        "rotation_score": 65,
        "liquidity_score": 70,
        "volatility": "Low",
        "leaders": ["Financials", "Auto"],
        "laggards": ["IT"],
        "summary": "Market showing strong momentum characteristics with broad participation."
    }

def get_regime_history(db: Session, days: int = 30):
    start_date = datetime.utcnow() - timedelta(days=days)
    history = db.query(MarketRegimeSnapshot).filter(MarketRegimeSnapshot.date >= start_date).order_by(MarketRegimeSnapshot.date.asc()).all()
    
    return [
        {
            "date": h.date.strftime("%Y-%m-%d"),
            "regime": h.regime_name,
            "code": h.regime_code,
            "score": (h.trend_score + h.breadth_score + h.volatility_score + h.rotation_score + h.liquidity_score) / 5
        } for h in history
    ]
