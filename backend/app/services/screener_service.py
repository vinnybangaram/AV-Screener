import traceback
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from app.data.yahoo_fetcher import fetch_stock_data
from app.services.technicals_service import compute_technicals
from app.services.fundamentals_service import get_fundamental_metrics

# Data Universe: NSE/BSE Master List
SCAN_POOL = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "LT", "KOTAKBANK",
    "ZOMATO", "MARUTI", "TITAN", "SUNPHARMA", "BAJFINANCE", "TATAMOTORS", "ASIANPAINT", "ADANIENT", "AXISBANK", "WIPRO",
    "ONGC", "JSWSTEEL", "NTPC", "M&M", "POWERGRID", "HCLTECH", "ADANIPORTS", "COALINDIA", "TATASTEEL", "ULTRACEMCO",
    "IRFC", "RVNL", "HAL", "BEL", "BHEL", "MAZDOCK", "COCHINSHIP", "HUDCO", "IREDA", "MAHABANK", "PFC", "RECLTD",
    "TATAELXSI", "KPITTECH", "TATACOMM", "JIOFIN", "POLYCAB", "KEI", "DIXON", "TRENT", "SUZLON", "PAYTM", "NYKAA",
    "IDEA", "YESBANK", "IDFCFIRSTB", "FEDERALBNK", "PNB", "CANBK", "UNIONBANK", "BANKBARODA", "MAHABANK", "IOB",
    "LICI", "ADANIPOWER", "JINDALSTEL", "HINDALCO", "GRASIM", "BAJAJ-AUTO", "CIPLA", "DLF", "EICHERMOT", "APOLLOHOSP",
    "INDUSINDBK", "ADANIGREEN", "TITAN", "TATACONSUM", "HINDUNILVR", "BRITANNIA", "NESTLEIND", "VBL"
]

def calculate_composite_score(metrics):
    """
    Requested weights:
    Fundamentals = 25%
    Technicals = 25%
    Momentum = 20%
    Liquidity (Volume) = 10%
    Risk = 10%
    Sentiment = 10%
    """
    f = metrics["fundamentals"]
    t = metrics["technicals"]
    
    # 1. Fundamentals (0-100)
    fund_score = (
        (min(f["roe"] / 15.0, 1.0) * 40) +
        (max(0, (1 - f["debt_eq"] / 1.5)) * 30) +
        (min(f["sales_growth"] / 15.0, 1.0) * 30)
    )
    
    # 2. Technicals (0-100)
    tech_score = (
        (30 if t["above_200"] else 0) +
        (30 if t["above_50"] else 0) +
        (40 if t["rsi"] > 40 and t["rsi"] < 70 else 20)
    )
    
    # 3. Momentum (0-100)
    mom_score = min(max(t["day_change"] * 10 + 50, 0), 100)
    
    # 4. Liquidity (0-100)
    vol_ratio = t["current_vol"] / t["vol20"] if t["vol20"] > 0 else 1.0
    liq_score = min(vol_ratio * 30, 100)
    
    # 5. Risk (0-100)
    # Higher volatility (ATR/Price) means higher risk, so lower score
    risk_factor = t["atr"] / metrics["price"] if metrics["price"] > 0 else 0.1
    risk_score = max(0, 100 - (risk_factor * 1000))
    
    # 6. Sentiment (0-100)
    sent_score = 70 if t["is_breakout"] else 50
    
    final = (
        (fund_score * 0.25) +
        (tech_score * 0.25) +
        (mom_score * 0.20) +
        (liq_score * 0.10) +
        (risk_score * 0.10) +
        (sent_score * 0.10)
    )
    
    return {
        "final": round(final, 1),
        "fundamental": round(fund_score, 1),
        "technical": round(tech_score, 1),
        "momentum": round(mom_score, 1),
        "risk": round(risk_score, 1),
        "conviction": "High" if final > 75 else "Medium" if final > 50 else "Low"
    }

def process_ticker(ticker):
    try:
        df = fetch_stock_data(ticker, period="1y", interval="1d")
        if df is None or len(df) < 50: return None
        
        tech = compute_technicals(df)
        fund = get_fundamental_metrics(ticker)
        price = float(df['Close'].iloc[-1])
        
        scores = calculate_composite_score({
            "price": price,
            "technicals": tech,
            "fundamentals": fund
        })
        
        return {
            "ticker": ticker,
            "company": ticker, # In production, fetch from DB
            "sector": fund["sector"],
            "current_price": price,
            "score": scores["final"],
            "conviction_level": scores["conviction"],
            "scores_breakdown": {
                "fundamental_score": scores["fundamental"],
                "momentum_score": scores["momentum"],
                "technical_score": scores["technical"],
                "risk_score": scores["risk"]
            },
            "metrics": {
                **tech,
                **fund
            }
        }
    except Exception as e:
        print(f"[ScreenerEngine] Error processing {ticker}: {e}")
        return None

def run_screener_on_tickers(filters=None, page=1, page_size=20, search=None):
    """
    Flagship discovery engine with weighted ranking, search, and pagination.
    """
    try:
        print(f"[ScreenerEngine] Running scan for {len(SCAN_POOL)} stocks... Filters: {filters}")
        
        with ThreadPoolExecutor(max_workers=15) as pool:
            raw_results = list(pool.map(process_ticker, SCAN_POOL))
        
        results = [r for r in raw_results if r is not None]
        print(f"[ScreenerEngine] Processed {len(results)}/{len(SCAN_POOL)} stocks successfully.")
        
        # 1. HARD FILTERS (Strict Exclusion)
        def safe_get(metrics, key, default=0):
            return metrics.get(key, default) if metrics.get(key) is not None else default

        print(f"[ScreenerEngine] Starting hard filtering with {len(results)} stocks.")

        # Search Exclusion
        if search:
            s = search.upper()
            results = [r for r in results if s in r["ticker"] or s in (r.get("sector") or "").upper()]
            print(f"[ScreenerEngine] -> After Search '{s}': {len(results)} left.")

        if filters:
            # Sector
            if filters.get("sector") and filters["sector"] != "All":
                sec = filters["sector"].upper()
                results = [r for r in results if sec in (r.get("sector") or "").upper()]
                print(f"[ScreenerEngine] -> After Sector '{sec}': {len(results)} left.")
            
            # Price
            if filters.get("price") and len(filters["price"]) >= 2:
                max_p = float(filters["price"][1])
                if max_p < 100000:
                    results = [r for r in results if r.get("current_price", 0) <= max_p]
                    print(f"[ScreenerEngine] -> After Max Price {max_p}: {len(results)} left.")
            
            # Volume Spike
            if filters.get("volSpike") and len(filters["volSpike"]) >= 1:
                threshold = float(filters["volSpike"][0])
                if threshold > 0:
                    results = [r for r in results if safe_get(r["metrics"], "current_vol") >= safe_get(r["metrics"], "vol20") * threshold]
                    print(f"[ScreenerEngine] -> After Vol Spike {threshold}x: {len(results)} left.")
            
            # P/E Ratio
            if filters.get("pe") and len(filters["pe"]) >= 2:
                pe_min, pe_max = filters["pe"]
                if pe_min > 0 or pe_max < 100:
                    results = [r for r in results if pe_min <= safe_get(r["metrics"], "pe", 20) <= pe_max]
                    print(f"[ScreenerEngine] -> After P/E {pe_min}-{pe_max}: {len(results)} left.")
            
            # ROE
            if filters.get("roe") and len(filters["roe"]) >= 1:
                roe_min = float(filters["roe"][0])
                if roe_min > 0:
                    results = [r for r in results if safe_get(r["metrics"], "roe", 0) >= roe_min]
                    print(f"[ScreenerEngine] -> After ROE Min {roe_min}%: {len(results)} left.")
            
            # RSI
            if filters.get("rsi") and len(filters["rsi"]) >= 2:
                rsi_min, rsi_max = filters["rsi"]
                if rsi_min > 0 or rsi_max < 100:
                    results = [r for r in results if rsi_min <= safe_get(r["metrics"], "rsi", 50) <= rsi_max]
                    print(f"[ScreenerEngine] -> After RSI {rsi_min}-{rsi_max}: {len(results)} left.")

            # Debt/Equity
            if filters.get("debtEq") and filters["debtEq"] != "Any":
                mode = filters["debtEq"]
                if mode == "Zero Debt":
                    results = [r for r in results if safe_get(r["metrics"], "debt_eq", 1) <= 0.05]
                elif mode == "Low":
                    results = [r for r in results if safe_get(r["metrics"], "debt_eq", 1) <= 0.5]
                elif mode == "Moderate":
                    results = [r for r in results if safe_get(r["metrics"], "debt_eq", 1) <= 1.5]
                print(f"[ScreenerEngine] -> After Debt/Eq '{mode}': {len(results)} left.")

            # Breakout Pattern
            if filters.get("breakout") and filters["breakout"] != "Any":
                if filters["breakout"] == "Fresh Breakout":
                    results = [r for r in results if r["metrics"].get("is_breakout", False)]
                    print(f"[ScreenerEngine] -> After Breakout: {len(results)} left.")

            # AI Conviction
            if filters.get("conviction") and len(filters["conviction"]) >= 1:
                c_min = filters["conviction"][0]
                if c_min > 0:
                    results = [r for r in results if r.get("score", 0) >= c_min]
                    print(f"[ScreenerEngine] -> After Conviction {c_min}: {len(results)} left.")

        # 2. WEIGHTED RANKING (Sorting Order)
        for r in results:
            r["rank_score"] = r.get("score", 50)
        
        # 3. Sorting
        results = sorted(results, key=lambda x: x["rank_score"], reverse=True)
        
        # 4. Pagination
        total_count = len(results)
        start_idx = (page - 1) * page_size
        paginated_results = results[start_idx : start_idx + page_size]
        
        # 5. Fallback/Empty State Logic (Ensures no dead ends)
        if not paginated_results and results:
            paginated_results = results[:page_size] # Return top candidates if page is empty
            
        return {
            "success": True,
            "data": paginated_results,
            "total": total_count,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        print(f"❌ [ScreenerEngine] Master Error: {e}")
        import traceback
        traceback.print_exc()
        raise e
