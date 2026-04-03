from typing import Dict, Any

# --- New Dashboard Scoring Logic ---

def calculate_durability_score(fundamentals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a score (0-100) based on ROE, Debt/Equity, Profit Growth, and Promoters.
    """
    score = 0
    # ROE (Ideal > 15%)
    roe = fundamentals.get("roe", 0)
    if roe >= 0.15: score += 25
    elif roe >= 0.10: score += 15
    elif roe > 0: score += 5
    
    # Debt to Equity (Ideal < 0.5)
    d_e = fundamentals.get("debt_to_equity", 0)
    if d_e <= 0.5: score += 25
    elif d_e <= 1.0: score += 15
    elif d_e <= 1.5: score += 5
    
    # Growth (Revenue and Earnings)
    rev_g = fundamentals.get("revenue_growth", 0)
    ear_g = fundamentals.get("earnings_growth", 0)
    avg_g = (rev_g + ear_g) / 2
    if avg_g >= 0.15: score += 25
    elif avg_g >= 0.08: score += 15
    elif avg_g > 0: score += 5
    
    # Promoter Holding (Ideal > 50%)
    prom = fundamentals.get("promoter_holding", 0)
    if prom >= 50: score += 25
    elif prom >= 30: score += 15
    elif prom >= 10: score += 5

    label = "Strong" if score >= 70 else "Moderate" if score >= 40 else "Weak"
    return {"score": score, "label": label}

def calculate_valuation_score(fundamentals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a score based on PE vs Sector and PEG Ratio.
    """
    score = 0
    # Since we don't have sector PEs for all, we use a benchmark of 25 for NIFTY.
    price = fundamentals.get("price", 100)
    ear_g = fundamentals.get("earnings_growth", 0.1) # Default 10%
    eps = price * 0.04 # Approximation for PE 25 if growth matches
    
    # PEG Ratio (Ideal < 1.0)
    # We estimate PE for mockery if not provided, normally we calculate it
    pe = fundamentals.get("pe", 25) 
    peg = pe / (ear_g * 100) if ear_g > 0 else 5.0
    
    if peg <= 1.0: score += 50
    elif peg <= 1.5: score += 30
    elif peg <= 2.5: score += 10
    
    # Market Cap / Size stability
    m_cap = fundamentals.get("market_cap", 0)
    if m_cap > 50000000000: score += 50 # Large Cap stability
    elif m_cap > 5000000000: score += 30
    else: score += 10

    label = "Undervalued" if score >= 70 else "Fair" if score >= 40 else "Expensive"
    return {"score": score, "label": label}

def calculate_momentum_score(technical: Dict[str, Any], volume: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a score based on RSI, Trend vs Moving Averages, and Volume.
    """
    score = 0
    # RSI (40-70 range is strong momentum)
    rsi = technical.get("rsi", 50)
    if 40 <= rsi <= 70: score += 30
    elif rsi > 70: score += 20 # Strong but overbought
    elif rsi > 30: score += 10
    
    # Trend (Price vs 50DMA and 200DMA)
    trend = technical.get("trend", "Neutral")
    if trend == "Uptrend": score += 40
    elif trend == "Sideways": score += 20
    
    # Volume Factor
    vol_st = volume.get("status", "Normal")
    if vol_st in ["Spike", "High"]: score += 30
    elif vol_st == "Normal": score += 15

    label = "Bullish" if score >= 70 else "Neutral" if score >= 40 else "Bearish"
    return {"score": score, "label": label}

def get_smart_classification(final_score: float) -> str:
    """Classifies the stock based on the master score."""
    if final_score >= 80: return "Strong Buy"
    if final_score >= 65: return "Buy"
    if final_score >= 45: return "Hold"
    return "Avoid"

def get_analysis_scores(data: Dict[str, Any]) -> Dict[str, Any]:
    """Assembles all score metrics for the analysis dashboard."""
    durability = calculate_durability_score(data["fundamentals"])
    valuation = calculate_valuation_score(data["fundamentals"])
    momentum = calculate_momentum_score(data["technical"], data["volume"])
    
    # Master Score Construction
    # 0.30 Fundamentals (Durability) + 0.25 Momentum + 0.20 Volume + 0.15 Valuation + 0.10 Risk
    # Risk is derived from high debt or high PE.
    risk_points = 10 if data["fundamentals"].get("debt_to_equity", 0) < 0.5 else 5
    
    # Final Score = 30% Fundamentals + 25% Momentum + 20% Volume + 15% Valuation + 10% Risk
    # Each raw component is 0-100.
    final_score = (
        (durability["score"] * 0.30) +
        (momentum["score"] * 0.25) +
        (momentum["score"] * 0.20) + # Volume proxy
        (valuation["score"] * 0.15) +
        ((risk_points * 10) * 0.10)
    )
    
    return {
        "durability": durability,
        "valuation": valuation,
        "momentum": momentum,
        "final_score": round(final_score, 1),
        "classification": get_smart_classification(final_score)
    }

# --- Legacy Compatibility for Screener ---

def evaluate_fundamental(fund: Dict[str, Any]) -> float:
    return float(calculate_durability_score(fund)["score"])

def evaluate_momentum(price, high, rsi, macd, signal, is_above_50, is_above_200) -> float:
    trend = "Uptrend" if is_above_50 and is_above_200 else "Downtrend"
    return float(calculate_momentum_score({"rsi": rsi, "trend": trend}, {"status": "Normal"})["score"])

def evaluate_volume(curr, avg) -> float:
    return 80.0 if curr > avg * 1.5 else 50.0

def evaluate_risk(risk_val) -> float:
    # risk_val is usually atr/price
    return 80.0 if risk_val < 0.03 else 50.0

def calculate_final_score(scores: Dict[str, float]) -> float:
    if not scores: return 0.0
    return sum(scores.values()) / len(scores)
