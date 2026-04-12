from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services import market_service, news_service, notification_service, watchlist_service

# Intelligent Memory Cache for Global Market Data
_global_cache = {
    "data": None,
    "last_updated": None,
    "ttl_seconds": 300 # 5 Minutes
}

def get_dashboard_data(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Aggregates global market intelligence and personalized user data.
    """
    now = datetime.utcnow()
    
    # 1. Fetch or Refresh Global Data
    if (_global_cache["data"] is None or 
        (now - _global_cache["last_updated"]).total_seconds() > _global_cache["ttl_seconds"]):
        
        print(f"[Dashboard] Refreshing global market cache at {now.isoformat()}")
        
        print("[Dashboard] Loading top movers...")
        top_movers = market_service.get_top_movers()
        
        print("[Dashboard] Loading market news...")
        market_news = news_service.get_market_news()
        
        print("[Dashboard] Loading market context...")
        market_context = market_service.get_market_context()
        
        print("[Dashboard] Global cache refresh complete.")
        _global_cache["data"] = {
            "topGainers": top_movers.get("gainers", []),
            "topLosers": top_movers.get("losers", []),
            "marketNews": market_news,
            "marketContext": market_context
        }
        _global_cache["last_updated"] = now

    # 2. Fetch Personalized User Data (Per-Request)
    # Portfolio Metrics (Total Value, P/L, Performers)
    # Use existing logic from dashboard.py or watchlist_service
    watchlist = watchlist_service.get_watchlist(db, user_id)
    
    user_metrics = {
        "total_value": 0,
        "total_pl_abs": 0,
        "total_pl_pct": 0,
        "best_performer": None,
        "worst_performer": None,
        "count": len(watchlist)
    }

    if watchlist:
        total_value = sum(item["current_price"] for item in watchlist)
        total_pl_abs = sum(item["profit_loss_abs"] for item in watchlist)
        avg_entry = sum(item["added_price"] for item in watchlist)
        total_pl_pct = (total_pl_abs / avg_entry) * 100 if avg_entry > 0 else 0
        
        best = max(watchlist, key=lambda x: x["profit_loss_pct"])
        worst = min(watchlist, key=lambda x: x["profit_loss_pct"])
        
        user_metrics.update({
            "total_value": round(total_value, 2),
            "total_pl_abs": round(total_pl_abs, 2),
            "total_pl_pct": round(total_pl_pct, 2),
            "best_performer": {
                "symbol": best["symbol"],
                "pl_pct": round(best["profit_loss_pct"], 2)
            },
            "worst_performer": {
                "symbol": worst["symbol"],
                "pl_pct": round(worst["profit_loss_pct"], 2)
            }
        })

    # User Notifications
    notifications = notification_service.get_user_notifications(db, user_id)
    # Format notifications for the institucional UI
    formatted_notifs = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "priority": n.priority,
            "symbol": n.symbol,
            "timestamp": n.created_at.isoformat()
        } for n in notifications[:10] # Top 10 latest
    ]

    return {
        "global": _global_cache["data"],
        "user": {
            "metrics": user_metrics,
            "notifications": formatted_notifs,
            "watchlist": watchlist
        },
        "lastUpdated": _global_cache["last_updated"].isoformat()
    }
