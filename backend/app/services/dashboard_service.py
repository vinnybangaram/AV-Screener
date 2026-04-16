from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services import market_service, news_service, notification_service, watchlist_service, snapshot_service

# Intelligent Memory Cache for Global Market Data
_global_cache = {
    "data": None,
    "last_updated": None,
    "ttl_seconds": 300 # 5 Minutes
}

def get_dashboard_data(db: Session, user_id: int, category: str = "All", timeframe: str = "This Month") -> Dict[str, Any]:
    """
    Aggregates global market intelligence and personalized user data.
    """
    now = datetime.utcnow()
    
    last_ref = _global_cache.get("last_updated")
    is_stale = not last_ref or (now - last_ref).total_seconds() > _global_cache["ttl_seconds"]
    
    if _global_cache["data"] is None or is_stale:
        
        print(f"[Dashboard] Refreshing global market cache at {now.isoformat()}")
        top_movers = market_service.get_top_movers()
        market_news = news_service.get_market_news()
        market_context = market_service.get_market_context()
        
        _global_cache["data"] = {
            "topGainers": top_movers.get("gainers", []),
            "topLosers": top_movers.get("losers", []),
            "marketNews": market_news,
            "marketContext": market_context
        }
        _global_cache["last_updated"] = now

    # 2. Fetch Personalized User Data
    # Get watchlist items (already updated with latest prices in the service)
    watchlist = watchlist_service.get_watchlist(db, user_id)
    
    # Filter by category if requested
    filtered_watchlist = watchlist
    if category != "All":
        # Mapping frontend names to database values
        cat_map = {
            "Penny Stocks": "Penny",
            "Multibaggers": "Multibagger"
        }
        target_cat = cat_map.get(category, category).lower()
        filtered_watchlist = [item for item in watchlist if target_cat in item["category"].lower() or item["category"].lower() in target_cat]

    user_metrics = {
        "total_value": 0,
        "total_pl_abs": 0,
        "total_pl_pct": 0,
        "best_performer": None,
        "worst_performer": None,
        "count": len(filtered_watchlist)
    }

    if filtered_watchlist:
        total_value = sum(item["latest_price"] * item["quantity"] for item in filtered_watchlist)
        total_pl_abs = sum(item["latest_pnl"] * item["quantity"] for item in filtered_watchlist)
        total_entry = sum(item["entry_price"] * item["quantity"] for item in filtered_watchlist)
        total_pl_pct = (total_pl_abs / total_entry) * 100 if total_entry > 0 else 0
        
        best = max(filtered_watchlist, key=lambda x: x["latest_pnl_percent"])
        worst = min(filtered_watchlist, key=lambda x: x["latest_pnl_percent"])
        
        user_metrics.update({
            "total_value": round(total_value, 2),
            "total_pl_abs": round(total_pl_abs, 2),
            "total_pl_pct": round(total_pl_pct, 2),
            "best_performer": {
                "symbol": best["symbol"],
                "pl_pct": round(best["latest_pnl_percent"], 2)
            },
            "worst_performer": {
                "symbol": worst["symbol"],
                "pl_pct": round(worst["latest_pnl_percent"], 2)
            }
        })

    # Historical Trend Data for Charts
    performance_trend = snapshot_service.get_performance_trend(db, user_id, category, timeframe)

    # User Notifications
    notifications = notification_service.get_user_notifications(db, user_id)
    formatted_notifs = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "priority": n.priority,
            "symbol": n.symbol,
            "timestamp": n.created_at.isoformat()
        } for n in notifications[:10]
    ]

    return {
        "global": _global_cache["data"],
        "user": {
            "metrics": user_metrics,
            "notifications": formatted_notifs,
            "watchlist": filtered_watchlist,
            "performanceTrend": performance_trend
        },
        "filters": {
            "category": category,
            "timeframe": timeframe
        },
        "lastUpdated": _global_cache["last_updated"].isoformat()
    }
