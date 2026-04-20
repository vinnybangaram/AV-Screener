from fastapi import APIRouter, HTTPException, Query
import asyncio
from typing import Dict, Any, Optional
from app.services.stock_analysis_service import get_full_analysis
from app.services.llm_service import get_ai_analysis
from app.services.scoring_service import get_analysis_scores
from app.data.ticker_db import TICKER_DB
from app.utils.cache import analysis_cache
import requests

router = APIRouter()

@router.get("/search")
def search_tickers(q: str = Query("", description="Search query")):
    """
    Returns a list of matching tickers from both local DB and Live Market.
    """
    if not q or len(q) < 2:
        return []
        
    query = q.upper()
    
    # 1. Search local top tickers (Fast)
    local_matches = [
        item for item in TICKER_DB 
        if query in item["symbol"].upper() or query in item["name"].upper()
    ]
    
    # 2. Search Live Yahoo API (Global)
    live_results = []
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=15"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=3)
        if response.status_code == 200:
            data = response.json()
            for quote in data.get('quotes', []):
                # Filter for Indian NSE (NSI) and BSE exchanges
                if quote.get('exchange') in ['NSI', 'BSE']:
                    symbol = quote.get('symbol', '').replace('.NS', '').replace('.BO', '')
                    live_results.append({
                        "symbol": symbol,
                        "name": quote.get('shortname') or quote.get('longname') or symbol
                    })
    except Exception as e:
        print(f"Live search failed: {e}")

    seen_symbols = {item["symbol"] for item in local_matches}
    for item in live_results:
        if item["symbol"] not in seen_symbols:
            local_matches.append(item)
            seen_symbols.add(item["symbol"])
            
    return local_matches[:15]

@router.get("")
async def analyze_stock(
    symbol: str = Query(..., description="The stock ticker symbol"), 
    horizon: str = "30D",
    period: str = "1y"
):
    """
    Detailed stock analysis endpoint.
    Optimized with Caching and Parallel Fetching.
    """
    ticker = symbol.upper()
    cache_key = f"analysis_{ticker}_{period}"
    
    # 1. Check Cache
    cached_data = analysis_cache.get(cache_key)
    if cached_data:
        return {"success": True, "data": cached_data, "cached": True}

    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    # 2. Parallel Core Analysis & AI Insights
    analysis_data = await get_full_analysis(ticker, period=period)
    if not analysis_data:
        raise HTTPException(status_code=404, detail=f"Stock data for {ticker} not found.")

    # 3. Parallel Score, AI, Forecast, and Targets
    from app.services.forecast_engine import engine as forecast_engine
    from app.services.price_target_engine import engine as target_engine

    async def get_forecasts():
        try:
            return {
                "7D": await asyncio.to_thread(forecast_engine.generate_forecast, ticker, "7D"),
                "30D": await asyncio.to_thread(forecast_engine.generate_forecast, ticker, "30D"),
                "90D": await asyncio.to_thread(forecast_engine.generate_forecast, ticker, "90D")
            }
        except: return None

    async def get_ai():
        return await asyncio.to_thread(get_ai_analysis, analysis_data)

    async def get_scores():
        return await asyncio.to_thread(get_analysis_scores, analysis_data)

    async def get_targets():
        try: return await asyncio.to_thread(target_engine.generate_targets, ticker)
        except: return None

    # Execute all in parallel
    ai_task = get_ai()
    scores_task = get_scores()
    forecasts_task = get_forecasts()
    targets_task = get_targets()

    ai_insights, scores, forecasts, price_targets = await asyncio.gather(
        ai_task, scores_task, forecasts_task, targets_task
    )

    final_result = {
        "analysis": analysis_data,
        "ai_insights": ai_insights,
        "scores": scores,
        "forecasts": forecasts,
        "price_targets": price_targets
    }

    # Store in Cache
    analysis_cache.set(cache_key, final_result)

    return {
        "success": True,
        "data": final_result
    }
