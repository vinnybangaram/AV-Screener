from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.portfolio_health import PortfolioHealthSnapshot
from app.services import watchlist_service, market_service
from app.data.ticker_db import TICKER_DB

# Mapping for sectors (Simplified)
SECTOR_MAP = {
    "RELIANCE": "Energy", "TCS": "IT", "HDFCBANK": "Finance", "INFY": "IT", 
    "ICICIBANK": "Finance", "SBIN": "Finance", "BHARTIARTL": "Telecom", 
    "ITC": "FMCG", "KOTAKBANK": "Finance", "LT": "Construction", 
    "HINDUNILVR": "FMCG", "ASIANPAINT": "Consumer Durables", "AXISBANK": "Finance",
    "MARUTI": "Auto", "TITAN": "Consumer Durables", "BAJFINANCE": "Finance",
    "SUNPHARMA": "Pharma", "ULTRACEMCO": "Construction Materials", "ADANIENT": "Diversified",
    "NTPC": "Power", "TATAMOTORS": "Auto", "WIPRO": "IT", "JSWSTEEL": "Metals",
    "ONGC": "Energy", "HCLTECH": "IT", "TATASTEEL": "Metals", "M&M": "Auto",
    "COALINDIA": "Energy", "POWERGRID": "Power", "ZOMATO": "Internet", 
    "NYKAA": "Internet", "PAYTM": "Finance", "IRCTC": "Hospitality",
    "JIOFIN": "Finance", "HAL": "Defense", "BEL": "Defense", "VEDL": "Metals",
    "GAIL": "Energy", "IOC": "Energy", "DLF": "Real Estate", 
    "GODREJCP": "FMCG", "DABUR": "FMCG", "PIDILITIND": "Chemicals"
}

def calculate_portfolio_health(db: Session, user_id: int) -> Dict[str, Any]:
    """
    AVE-1003 Portfolio Health & Risk Engine
    """
    positions = watchlist_service.get_watchlist(db, user_id, include_inactive=False)
    
    if not positions:
        return {
            "health_score": 0,
            "risk_level": "None",
            "warning": "No active holdings found.",
            "recommendation": "Add high-conviction stocks to initiate analysis.",
            "factors": {
                "diversification": 0, "concentration": 0, "volatility": 0,
                "correlation": 0, "drawdown": 0, "cash": 0
            }
        }

    # 1. Basic Metrics
    total_value = sum((p.get("latest_price") or 0) * (p.get("quantity") or 1) for p in positions)
    
    if total_value == 0:
        return {
            "health_score": 50,
            "risk_level": "Unknown",
            "warning": "Total portfolio value is zero.",
            "recommendation": "Check if entry prices and quantities are set correctly."
        }

    # Calculate weights
    for p in positions:
        val = (p.get("latest_price") or 0) * (p.get("quantity") or 1)
        p["weight"] = val / total_value
        p["sector"] = SECTOR_MAP.get(p.get("symbol", "").upper(), "Other")

    # ── FACTOR 1: DIVERSIFICATION (25%) ──
    # Holdings count (12+ items is 100)
    count_score = min(100, (len(positions) / 12) * 100)
    # Sector count (6+ sectors is 100)
    unique_sectors = set(p.get("sector", "Other") for p in positions)
    sector_score = min(100, (len(unique_sectors) / 6) * 100)
    d_score = (count_score * 0.5) + (sector_score * 0.5)

    # ── FACTOR 2: CONCENTRATION (20%) ──
    sorted_pos = sorted(positions, key=lambda x: x.get("weight", 0), reverse=True)
    top1 = sorted_pos[0].get("weight", 0)
    top3 = sum(p.get("weight", 0) for p in sorted_pos[:3])
    
    c_score = 100
    if top1 > 0.25: c_score -= 30
    if top1 > 0.40: c_score -= 40
    if top3 > 0.60: c_score -= 20
    if top3 > 0.80: c_score -= 10
    c_score = max(0, c_score)

    # ── FACTOR 3: VOLATILITY (15%) ──
    high_risk_weight = sum(p.get("weight", 0) for p in positions if (p.get("category") or "").lower() in ["intraday", "penny", "penny stocks"])
    v_score = 100 - (high_risk_weight * 100)
    v_score = max(0, v_score)

    # ── FACTOR 4: CORRELATION (15%) ──
    sector_weights = {}
    for p in positions:
        s = p.get("sector", "Other")
        sector_weights[s] = sector_weights.get(s, 0) + p.get("weight", 0)
    
    max_sector_weight = max(sector_weights.values()) if sector_weights else 0
    r_score = 100 - (max_sector_weight * 100)
    if r_score < 40: r_score = 40 

    # ── FACTOR 5: DRAWDOWN RESILIENCE (15%) ──
    avg_pnl_pct = sum((p.get("latest_pnl_percent") or 0) * p.get("weight", 0) for p in positions)
    dr_score = 70 + (avg_pnl_pct * 2) 
    dr_score = max(0, min(100, dr_score))

    # ── FACTOR 6: CASH EFFICIENCY (10%) ──
    # Assume a virtual cash buffer of 15% for optimal results
    # Since we don't have real cash data, we use a constant "Healthy" score 
    # unless concentration is extremely high.
    ce_score = 80 if len(positions) > 3 else 50

    # FINAL CALCULATION
    final_score = (
        (d_score * 0.25) +
        (c_score * 0.20) +
        (v_score * 0.15) +
        (r_score * 0.15) +
        (dr_score * 0.15) +
        (ce_score * 0.10)
    )

    # ── RISK LEVEL & LABELS ──
    risk_level = "Low"
    if final_score < 40: risk_level = "Critical"
    elif final_score < 60: risk_level = "High"
    elif final_score < 80: risk_level = "Medium"
    
    # ── WARNINGS & RECOMMENDATIONS ──
    warning = "Portfolio structure is robust."
    recommendation = "Maintain current strategy and monitor sector updates."
    
    if top1 > 0.3:
        warning = f"High concentration in {sorted_pos[0]['symbol']} ({int(top1*100)}%)"
        recommendation = "Trimming your top holding could reduce single-stock risk."
    elif max_sector_weight > 0.5:
        warning = f"Sector overload in {max(sector_weights, key=sector_weights.get)}"
        recommendation = "Consider diversifying into defensive sectors like FMCG or Pharma."
    elif len(positions) < 4:
        warning = "Under-diversified portfolio"
        recommendation = "Add 2-3 more high-conviction assets to lower volatility."

    result = {
        "health_score": round(final_score, 1),
        "risk_level": risk_level,
        "warning": warning,
        "recommendation": recommendation,
        "factors": {
            "diversification": int(d_score),
            "concentration": int(c_score),
            "volatility": int(v_score),
            "correlation": int(r_score),
            "drawdown": int(dr_score),
            "cash": int(ce_score)
        },
        "allocation": [
             {"name": s, "value": round(w * 100, 1)} for s, w in sector_weights.items()
        ]
    }

    return result

def get_health_history(db: Session, user_id: int, days: int = 90):
    cutoff = datetime.utcnow() - timedelta(days=days)
    return db.query(PortfolioHealthSnapshot).filter(
        PortfolioHealthSnapshot.user_id == user_id,
        PortfolioHealthSnapshot.created_at >= cutoff
    ).order_by(PortfolioHealthSnapshot.created_at.asc()).all()

def save_health_snapshot(db: Session, user_id: int):
    health = calculate_portfolio_health(db, user_id)
    if health["health_score"] == 0: return None
    
    snapshot = PortfolioHealthSnapshot(
        user_id = user_id,
        health_score = health["health_score"],
        risk_level = health["risk_level"],
        diversification_score = health["factors"]["diversification"],
        concentration_score = health["factors"]["concentration"],
        volatility_score = health["factors"]["volatility"],
        correlation_score = health["factors"]["correlation"],
        drawdown_score = health["factors"]["drawdown"],
        cash_score = health["factors"]["cash"],
        top_warning = health["warning"],
        recommendation = health["recommendation"]
    )
    db.add(snapshot)
    db.commit()
    return snapshot
