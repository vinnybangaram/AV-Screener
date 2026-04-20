from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.services.stock_analysis_service import get_full_analysis
from app.services.llm_service import get_ai_analysis
from app.services.scoring_service import get_analysis_scores
from app.data.ticker_db import TICKER_DB

router = APIRouter()

import requests

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

    # Combine and deduplicate
    seen_symbols = {item["symbol"] for item in local_matches}
    for item in live_results:
        if item["symbol"] not in seen_symbols:
            local_matches.append(item)
            seen_symbols.add(item["symbol"])
            
    return local_matches[:15]

@router.get("")
def analyze_stock(
    symbol: str = Query(..., description="The stock ticker symbol"), 
    horizon: str = "30D",
    period: str = "1y"
):
    """
    Detailed stock analysis endpoint.
    Returns technical indicators, chart data, and AI-generated insights.
    """
    print("Symbol received:", symbol)
    ticker = symbol.upper()
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    analysis_data = get_full_analysis(ticker, period=period)
    
    if not analysis_data:
        raise HTTPException(status_code=404, detail=f"Stock data for {ticker} not found.")

    # Call AI service for explanation
    ai_insights = get_ai_analysis(analysis_data)
    
    # Calculate Institutional Scores
    scores = get_analysis_scores(analysis_data)

    # 1. NEW: Get Probability Forecast
    from app.services.forecast_engine import engine as forecast_engine
    try:
        # Forecast for 7D, 30D, 90D to support all tab views
        forecasts = {
            "7D": forecast_engine.generate_forecast(ticker, "7D"),
            "30D": forecast_engine.generate_forecast(ticker, "30D"),
            "90D": forecast_engine.generate_forecast(ticker, "90D")
        }
    except:
        forecasts = None
        
    # 2. NEW: Get Price Targets
    from app.services.price_target_engine import engine as target_engine
    try:
        price_targets = target_engine.generate_targets(ticker)
    except:
        price_targets = None
        
    return {
        "success": True,
        "data": {
            "analysis": analysis_data,
            "ai_insights": ai_insights,
            "scores": scores,
            "forecasts": forecasts,
            "price_targets": price_targets
        }
    }
