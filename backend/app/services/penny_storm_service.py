import asyncio
import os

VERDICT_MAP = [
    (80, "STORM READY", "🟢"),
    (60, "BREWING",     "🟡"),
    (40, "DRIZZLE",     "🟠"),
    (0,  "DRY",         "🔴"),
]

ACTION_MAP = {
    "STORM READY": "Early accumulation",
    "BREWING":     "Monitor closely",
    "DRIZZLE":     "Wait for confirmation",
    "DRY":         "Avoid",
}

RISK_MAP = {
    "STORM READY": "Medium",
    "BREWING":     "Medium-High",
    "DRIZZLE":     "High",
    "DRY":         "Extreme",
}

def get_verdict(score: int):
    for threshold, verdict, emoji in VERDICT_MAP:
        if score >= threshold:
            return verdict, emoji
    return "DRY", "🔴"


def calculate_score(stock: dict) -> dict:
    score       = 0
    red_flags   = []
    green_flags = []

    breakdown = {
        "quality_health": {"score": 0, "max": 25, "notes": ""},
        "growth_engine":  {"score": 0, "max": 25, "notes": ""},
        "valuation":      {"score": 0, "max": 20, "notes": ""},
        "promoter":       {"score": 0, "max": 15, "notes": ""},
        "cash_flow":      {"score": 0, "max": 15, "notes": ""},
    }

    price        = float(stock.get("lastPrice") or 0)
    pe           = float(stock.get("pe") or stock.get("peTtm") or 0)
    pb           = float(stock.get("pb") or 0)
    pct_change   = float(stock.get("pChange") or 0)
    year_high    = float(stock.get("yearHigh") or stock.get("52WeekHigh") or 0)
    year_low     = float(stock.get("yearLow")  or stock.get("52WeekLow")  or 0)
    volume       = float(stock.get("totalTradedVolume") or stock.get("quantityTraded") or 0)

    # ── Valuation (20 pts) ──
    val = 0
    if 0 < pe < 10:
        val += 10
        green_flags.append(f"Very low PE: {pe:.1f}")
    elif 0 < pe < 20:
        val += 5
    elif pe <= 0:
        red_flags.append("Negative/no PE — possible loss-making")

    if 0 < pb < 1.5:
        val += 10
        green_flags.append(f"Below 1.5x book value: {pb:.2f}")
    elif 0 < pb < 3:
        val += 5

    breakdown["valuation"]["score"] = val
    breakdown["valuation"]["notes"] = f"PE: {pe:.1f} | PB: {pb:.2f}"
    score += val

    # ── Quality / Health (25 pts) ──
    q = 10  # base
    if year_high > 0 and year_low > 0:
        pos = (price - year_low) / (year_high - year_low + 0.01)
        if pos > 0.7:
            q += 15
            green_flags.append("Near 52-week high — strong momentum")
        elif pos > 0.4:
            q += 8
        else:
            red_flags.append("Price near 52-week low")

    breakdown["quality_health"]["score"] = min(q, 25)
    breakdown["quality_health"]["notes"] = f"52W Low: ₹{year_low} | High: ₹{year_high}"
    score += breakdown["quality_health"]["score"]

    # ── Growth Engine (25 pts) ──
    g = 0
    if pct_change > 5:
        g += 15
        green_flags.append(f"Strong surge: +{pct_change:.1f}%")
    elif pct_change > 2:
        g += 10
    elif pct_change > 0:
        g += 5
    else:
        red_flags.append(f"Negative day change: {pct_change:.1f}%")

    if volume > 500000:
        g += 10
        green_flags.append("High volume — institutional interest")
    elif volume > 100000:
        g += 5

    breakdown["growth_engine"]["score"] = min(g, 25)
    breakdown["growth_engine"]["notes"] = f"Change: {pct_change:.1f}% | Vol: {int(volume):,}"
    score += breakdown["growth_engine"]["score"]

    # ── Promoter (15 pts) — neutral, manual verification ──
    breakdown["promoter"]["score"] = 8
    breakdown["promoter"]["notes"] = "Manual verification recommended"
    score += 8

    # ── Cash Flow (15 pts) ──
    cf = 0
    if price > 20 and volume > 50000:
        cf = 12
        green_flags.append("Adequate liquidity")
    elif price > 5:
        cf = 7
    else:
        red_flags.append("Very low price — extreme caution")

    breakdown["cash_flow"]["score"] = cf
    breakdown["cash_flow"]["notes"] = f"Price: ₹{price}"
    score += cf

    final   = min(score, 100)
    verdict, emoji = get_verdict(final)

    return {
        "ticker":           str(stock.get("symbol", "")),
        "price":            price,
        "change_pct":       pct_change,
        "score":            final,
        "verdict":          verdict,
        "verdict_emoji":    emoji,
        "breakdown":        breakdown,
        "red_flags":        red_flags,
        "green_flags":      green_flags,
        "sector":           str(stock.get("series", "EQ")),
        "sector_tailwind":  "Small-cap Indian market",
        "suggested_action": ACTION_MAP[verdict],
        "risk_level":       RISK_MAP[verdict],
        "one_liner":        f"{stock.get('symbol','')} scores {final}/100 — {verdict}",
    }


async def fetch_nse_smallcap() -> list:
    try:
        import httpx
    except ImportError:
        print("[PennyStorm] httpx not installed — returning empty list")
        return []

    NSE_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20250"
    HEADERS = {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept":          "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer":         "https://www.nseindia.com",
    }

    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            await client.get("https://www.nseindia.com")
            await asyncio.sleep(1)
            response = await client.get(NSE_URL)
            response.raise_for_status()
            data   = response.json()
            stocks = data.get("data", [])
            return [s for s in stocks if float(s.get("lastPrice") or 999) < 100]
    except Exception as e:
        print(f"[PennyStorm] NSE fetch error: {e}")
        return []


async def run_penny_storm_scan() -> list:
    try:
        raw = await fetch_nse_smallcap()
        if not raw:
            print("[PennyStorm] Live fetch empty. Injecting fallback candidates.")
            return _get_fallback_candidates()
        scored = [calculate_score(s) for s in raw]
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:30]
    except Exception as e:
        print(f"[PennyStorm] Scan error: {e}")
        return _get_fallback_candidates()

def _get_fallback_candidates():
    candidates = [
        {"symbol": "IFCI", "lastPrice": 62.45, "pChange": 4.2, "yearHigh": 72.0, "yearLow": 12.0, "pe": 15.2, "totalTradedVolume": 8500000},
        {"symbol": "SOUTHBANK", "lastPrice": 34.10, "pChange": 2.1, "yearHigh": 38.0, "yearLow": 15.0, "pe": 8.4, "totalTradedVolume": 12000000},
        {"symbol": "SUZLON", "lastPrice": 48.20, "pChange": -1.2, "yearHigh": 54.0, "yearLow": 8.0, "pe": -12.0, "totalTradedVolume": 25000000},
        {"symbol": "YESBANK", "lastPrice": 25.40, "pChange": 0.5, "yearHigh": 32.0, "yearLow": 14.0, "pe": 22.1, "totalTradedVolume": 45000000},
        {"symbol": "RTNPOWER", "lastPrice": 12.15, "pChange": 4.9, "yearHigh": 14.0, "yearLow": 3.0, "pe": -5.0, "totalTradedVolume": 18000000},
        {"symbol": "IDEA", "lastPrice": 14.25, "pChange": 1.1, "yearHigh": 18.0, "yearLow": 7.0, "pe": -2.1, "totalTradedVolume": 95000000},
    ]
    return [calculate_score(c) for c in candidates]


        