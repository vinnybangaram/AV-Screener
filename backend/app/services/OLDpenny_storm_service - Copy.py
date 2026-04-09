import httpx
import asyncio

# NSE free public API — no key needed
NSE_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20250"
NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com",
}

VERDICT_MAP = [
    (80, "STORM READY", "🟢"),
    (60, "BREWING",     "🟡"),
    (40, "DRIZZLE",     "🟠"),
    (0,  "DRY",         "🔴"),
]

def get_verdict(score: int):
    for threshold, verdict, emoji in VERDICT_MAP:
        if score >= threshold:
            return verdict, emoji
    return "DRY", "🔴"

def calculate_score(stock: dict) -> dict:
    """
    Penny Storm 100-point scoring on NSE data fields.
    """
    score = 0
    breakdown = {
        "quality_health": {"score": 0, "max": 25, "notes": ""},
        "growth_engine":  {"score": 0, "max": 25, "notes": ""},
        "valuation":      {"score": 0, "max": 20, "notes": ""},
        "promoter":       {"score": 0, "max": 15, "notes": ""},
        "cash_flow":      {"score": 0, "max": 15, "notes": ""},
    }
    red_flags   = []
    green_flags = []

    # ── Valuation (20 pts) ──
    pe = stock.get("pe") or stock.get("peTtm") or 0
    pb = stock.get("pb") or 0
    val_score = 0
    if 0 < pe < 10:
        val_score += 10
        green_flags.append(f"Very low PE: {pe:.1f}")
    elif 0 < pe < 20:
        val_score += 5
    elif pe <= 0:
        red_flags.append("Negative or no PE — possible loss-making")

    if 0 < pb < 1.5:
        val_score += 10
        green_flags.append(f"Trading below 1.5x book: {pb:.2f}")
    elif 0 < pb < 3:
        val_score += 5

    breakdown["valuation"]["score"] = val_score
    breakdown["valuation"]["notes"] = f"PE: {pe:.1f} | PB: {pb:.2f}"
    score += val_score

    # ── Quality / Health (25 pts) — proxy via price vs 52w ──
    year_high = stock.get("yearHigh") or stock.get("52WeekHigh") or 0
    year_low  = stock.get("yearLow")  or stock.get("52WeekLow")  or 0
    price     = stock.get("lastPrice") or 0
    q_score   = 0
    if year_high > 0 and year_low > 0:
        position = (price - year_low) / (year_high - year_low + 0.01)
        if position > 0.7:
            q_score += 15
            green_flags.append("Price near 52-week high — strong momentum")
        elif position > 0.4:
            q_score += 10
        else:
            q_score += 5
            red_flags.append("Price near 52-week low")
    q_score += 10  # base points for being listed small-cap
    breakdown["quality_health"]["score"] = min(q_score, 25)
    breakdown["quality_health"]["notes"] = f"52W: ₹{year_low} – ₹{year_high}"
    score += breakdown["quality_health"]["score"]

    # ── Growth Engine (25 pts) — proxy via % change & volume ──
    pct_change   = stock.get("pChange") or 0
    total_traded = stock.get("totalTradedVolume") or stock.get("quantityTraded") or 0
    g_score = 0
    if pct_change > 5:
        g_score += 15
        green_flags.append(f"Strong price surge: +{pct_change:.1f}%")
    elif pct_change > 2:
        g_score += 10
    elif pct_change > 0:
        g_score += 5
    else:
        red_flags.append(f"Negative day change: {pct_change:.1f}%")

    if total_traded > 500000:
        g_score += 10
        green_flags.append("High trading volume — institutional interest")
    elif total_traded > 100000:
        g_score += 5

    breakdown["growth_engine"]["score"] = min(g_score, 25)
    breakdown["growth_engine"]["notes"] = f"Change: {pct_change:.1f}% | Vol: {total_traded:,}"
    score += breakdown["growth_engine"]["score"]

    # ── Promoter (15 pts) — not available in index API, give neutral ──
    breakdown["promoter"]["score"]  = 8
    breakdown["promoter"]["notes"]  = "Manual verification recommended"
    score += 8

    # ── Cash Flow (15 pts) — proxy: if price > 20 & volume healthy ──
    cf_score = 0
    if price > 20 and total_traded > 50000:
        cf_score = 12
        green_flags.append("Adequate liquidity for penny stock")
    elif price > 5:
        cf_score = 7
    else:
        red_flags.append("Very low price — extreme caution")
    breakdown["cash_flow"]["score"] = cf_score
    breakdown["cash_flow"]["notes"] = f"Price: ₹{price}"
    score += cf_score

    verdict, emoji = get_verdict(score)

    # ── Suggested action ──
    action_map = {
        "STORM READY": "Early accumulation",
        "BREWING":     "Monitor closely",
        "DRIZZLE":     "Wait for confirmation",
        "DRY":         "Avoid",
    }
    risk_map = {
        "STORM READY": "Medium",
        "BREWING":     "Medium-High",
        "DRIZZLE":     "High",
        "DRY":         "Extreme",
    }

    return {
        "ticker":           stock.get("symbol", ""),
        "price":            price,
        "change_pct":       pct_change,
        "score":            min(score, 100),
        "verdict":          verdict,
        "verdict_emoji":    emoji,
        "breakdown":        breakdown,
        "red_flags":        red_flags,
        "green_flags":      green_flags,
        "sector":           stock.get("series", "EQ"),
        "sector_tailwind":  "Small-cap Indian market",
        "suggested_action": action_map[verdict],
        "risk_level":       risk_map[verdict],
        "one_liner":        f"{stock.get('symbol','')} scores {min(score,100)}/100 — {verdict}",
    }


async def fetch_nse_smallcap() -> list:
    async with httpx.AsyncClient(headers=NSE_HEADERS, timeout=20, follow_redirects=True) as client:
        # Prime cookies first
        await client.get("https://www.nseindia.com")
        await asyncio.sleep(1)
        response = await client.get(NSE_URL)
        response.raise_for_status()
        data = response.json()
        stocks = data.get("data", [])
        # Filter penny stocks: price < ₹100
        return [s for s in stocks if (s.get("lastPrice") or 0) < 100]


async def run_penny_storm_scan() -> list:
    try:
        raw = await fetch_nse_smallcap()
    except Exception as e:
        print(f"[PennyStorm] NSE fetch failed: {e}")
        return []

    scored = [calculate_score(s) for s in raw]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:30]   # top 30