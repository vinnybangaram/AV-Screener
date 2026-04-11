import finnhub
from datetime import datetime, timedelta
from app.utils.config import settings
from typing import List, Dict, Any

def get_stock_news(symbol: str) -> List[Dict[str, Any]]:
    """
    Fetches news for a specific stock using Finnhub.
    Adds lightweight sentiment tagging based on headlines.
    """
    if not settings.FINNHUB_API_KEY:
        print("FINNHUB_API_KEY missing - returning empty news")
        return []

    try:
        finnhub_client = finnhub.Client(api_key=settings.FINNHUB_API_KEY)
        
        # Format symbol for Finnhub (usually without .NS/.BO for global, but let's try both or strip)
        clean_symbol = symbol.split('.')[0]
        
        to_date = datetime.now().strftime('%Y-%m-%d')
        from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        news = finnhub_client.company_news(clean_symbol, _from=from_date, to=to_date)
        
        formatted_news = []
        for item in news[:10]: # Limit to 10
            headline = item.get('headline', '')
            summary = item.get('summary', '')
            
            # Lightweight sentiment analysis
            sentiment = "Neutral"
            bullish_words = ['surge', 'grow', 'rise', 'positive', 'profit', 'upgrade', 'buy', 'bullish', 'expansion']
            bearish_words = ['drop', 'fall', 'negative', 'loss', 'downgrade', 'sell', 'bearish', 'slump', 'decline']
            
            text_to_check = (headline + " " + summary).lower()
            
            bull_count = sum(1 for word in bullish_words if word in text_to_check)
            bear_count = sum(1 for word in bearish_words if word in text_to_check)
            
            if bull_count > bear_count: sentiment = "Bullish"
            elif bear_count > bull_count: sentiment = "Bearish"
            
            formatted_news.append({
                "id": item.get('id'),
                "datetime": datetime.fromtimestamp(item.get('datetime')).strftime('%Y-%m-%d %H:%M'),
                "headline": headline,
                "summary": summary,
                "url": item.get('url'),
                "image": item.get('image'),
                "source": item.get('source'),
                "sentiment": sentiment
            })
            
        return formatted_news
        
    except Exception as e:
        print(f"Error fetching Finnhub news: {e}")
        return []

def get_market_news() -> List[Dict[str, Any]]:
    """
    Fetches global market news highlights.
    Returns a standardized format: [{ title, impact, source, time }]
    """
    # For MVP, we use a mix of top tickers and logic or simulated data for reliability
    # In production, this would hit a broad market RSS or Finnhub category
    try:
        # Fallback/Simulated high-quality institutional news
        return [
            {
                "title": "RBI holds interest rates: Impact on banking stocks analyzed",
                "impact": "Neutral",
                "source": "Economic Times",
                "time": "1h ago"
            },
            {
                "title": "Nifty 50 reaches all-time high amid strong retail inflows",
                "impact": "Bullish",
                "source": "MoneyControl",
                "time": "3h ago"
            },
            {
                "title": "IT sector faces headwinds as US tech spending slows",
                "impact": "Bearish",
                "source": "CNBC-TV18",
                "time": "5h ago"
            },
            {
                "title": "Reliance Industries expands green energy footprint with new JV",
                "impact": "Bullish",
                "source": "Business Standard",
                "time": "8h ago"
            },
            {
                "title": "Global oil prices stabilize as demand concerns ease",
                "impact": "Neutral",
                "source": "Reuters",
                "time": "12h ago"
            }
        ]
    except Exception as e:
        print(f"[News] Global fetch error: {e}")
        return []
