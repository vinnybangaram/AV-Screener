from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services import market_service, news_service, notification_service, watchlist_service, snapshot_service, llm_service

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
        sector_perf = market_service.get_sector_performance()
        
        global_data = {
            "topGainers": top_movers.get("gainers", []),
            "topLosers": top_movers.get("losers", []),
            "marketNews": market_news,
            "marketContext": market_context,
            "sectorPerformance": sector_perf
        }
        
        # Add AI Insight
        global_data["aiInsight"] = llm_service.get_market_insight(global_data)
        
        _global_cache["data"] = global_data
        _global_cache["last_updated"] = now

    # 2. Compute Timeframe Start Date
    def get_start_date(tf):
        now_ist = datetime.utcnow()
        if tf == "Today":
            return datetime(now_ist.year, now_ist.month, now_ist.day)
        elif tf == "This Week":
            return now_ist - timedelta(days=now_ist.weekday())
        elif tf == "This Month":
            return datetime(now_ist.year, now_ist.month, 1)
        elif tf == "This Year":
            return datetime(now_ist.year, 1, 1)
        return now_ist - timedelta(days=30) # Default 30 days

    start_date = get_start_date(timeframe)

    # 3. Fetch Personalized User Data (Include Inactive for historical views)
    all_watchlist = watchlist_service.get_watchlist(db, user_id, include_inactive=True)
    
    # Active Watchlist (for the table)
    active_watchlist = [item for item in all_watchlist if item["is_active"]]
    
    # Filter by timeframe - items either active or added within timeframe
    timeframe_watchlist = [item for item in all_watchlist if item["added_at"] >= start_date or item["is_active"]]
    
    # 4. Apply Category Filtering
    filtered_active = active_watchlist
    filtered_timeframe = timeframe_watchlist

    if category != "All":
        cat_map = {
            "Penny Stocks": "penny", 
            "Multibaggers": "multibagger", 
            "Intraday Radar": "intraday",
            "Intraday Longs": "intraday_long",
            "Intraday Shorts": "intraday_short",
            "Core Portfolio": "core"
        }
        target_cat = cat_map.get(category, category).lower()
        
        if target_cat == 'investment':
            # 'Investment' target covers both Multibagger and Penny
            filtered_active = [item for item in active_watchlist if item["category"].lower() in ("multibagger", "penny")]
            filtered_timeframe = [item for item in timeframe_watchlist if item["category"].lower() in ("multibagger", "penny")]
        elif target_cat == 'intraday_long':
            filtered_active = [item for item in active_watchlist if "intraday" in item["category"].lower() and item["side"] != "SHORT"]
            filtered_timeframe = [item for item in timeframe_watchlist if "intraday" in item["category"].lower() and item["side"] != "SHORT"]
        elif target_cat == 'intraday_short':
            filtered_active = [item for item in active_watchlist if "intraday" in item["category"].lower() and item["side"] == "SHORT"]
            filtered_timeframe = [item for item in timeframe_watchlist if "intraday" in item["category"].lower() and item["side"] == "SHORT"]
        elif target_cat == 'core':
            # Core includes manual and general investment categories
            core_cats = ("core", "investment", "manual")
            filtered_active = [item for item in active_watchlist if item["category"].lower() in core_cats]
            filtered_timeframe = [item for item in timeframe_watchlist if item["category"].lower() in core_cats]
        else:
            filtered_active = [item for item in active_watchlist if target_cat in item["category"].lower()]
            filtered_timeframe = [item for item in timeframe_watchlist if target_cat in item["category"].lower()]

    # 5. Calculate Metrics
    def calculate_group_metrics(positions):
        if not positions:
            return {
                "total_value": 0, "total_pl_abs": 0, "total_pl_pct": 0,
                "today_pl_abs": 0, "today_pl_pct": 0, "count": 0,
                "long_pl_abs": 0, "short_pl_abs": 0,
                "today_long_pl_abs": 0, "today_short_pl_abs": 0
            }
        
        # We use current value for active, but for inactive we use their last known value
        active_pos = [item for item in positions if item["is_active"]]
        total_value = sum(item["latest_price"] * item["quantity"] for item in active_pos)
        total_entry = sum(item["entry_price"] * item["quantity"] for item in positions)
        
        # P/L logic: for active, it's live. for inactive, it's captured until closing.
        long_pos = [item for item in positions if item["side"] != "SHORT"]
        short_pos = [item for item in positions if item["side"] == "SHORT"]
        
        long_pl_abs = sum(item["latest_pnl"] * item["quantity"] for item in long_pos)
        short_pl_abs = sum(item["latest_pnl"] * item["quantity"] for item in short_pos)
        total_pl_abs = long_pl_abs + short_pl_abs
        
        total_pl_pct = (total_pl_abs / total_entry) * 100 if total_entry > 0 else 0
        
        # Today's performance (only for currently active symbols)
        active_symbols = [item["symbol"] for item in active_pos]
        daily_changes = market_service.get_daily_changes(active_symbols) if active_symbols else {}
        
        today_pl_abs = 0
        today_long_pl_abs = 0
        today_short_pl_abs = 0
        total_prev_value = 0
        
        for item in active_pos:
            change_data = daily_changes.get(item["symbol"])
            if change_data:
                item_today_pl = change_data["today_change_abs"] * item["quantity"]
                if item.get("side") == "SHORT":
                    item_today_pl = -item_today_pl
                    today_short_pl_abs += item_today_pl
                else:
                    today_long_pl_abs += item_today_pl
                
                today_pl_abs += item_today_pl
                total_prev_value += change_data["prev_close"] * item["quantity"]
            else:
                total_prev_value += item["latest_price"] * item["quantity"]
        
        today_pl_pct = (today_pl_abs / total_prev_value * 100) if total_prev_value > 0 else 0
        
        return {
            "total_value": round(total_value, 2),
            "total_pl_abs": round(total_pl_abs, 2),
            "long_pl_abs": round(long_pl_abs, 2),
            "short_pl_abs": round(short_pl_abs, 2),
            "today_long_pl_abs": round(today_long_pl_abs, 2),
            "today_short_pl_abs": round(today_short_pl_abs, 2),
            "total_pl_pct": round(total_pl_pct, 2),
            "today_pl_abs": round(today_pl_abs, 2),
            "today_pl_pct": round(today_pl_pct, 2),
            "count": len(active_pos)
        }

    # Calculate metrics for the currently filtered view
    active_metrics = calculate_group_metrics(filtered_timeframe)
    
    # Calculate specialized breakdowns for global dashboard UI context if needed
    intraday_positions_all = [item for item in timeframe_watchlist if "intraday" in item["category"].lower()]
    intraday_metrics = calculate_group_metrics(intraday_positions_all)

    # Calculate Last 30 Days PnL (Global cross-category)
    thirty_days_ago = now - timedelta(days=30)
    last_30d_long = sum(i["latest_pnl"] * i["quantity"] for i in all_watchlist if i["added_at"] >= thirty_days_ago and i["side"] != "SHORT")
    last_30d_short = sum(i["latest_pnl"] * i["quantity"] for i in all_watchlist if i["added_at"] >= thirty_days_ago and i["side"] == "SHORT")

    user_metrics = {
        **active_metrics,
        "intraday": intraday_metrics,
        "last_30d_pnl": {
            "long": round(last_30d_long, 2),
            "short": round(last_30d_short, 2),
            "total": round(last_30d_long + last_30d_short, 2)
        }
    }
    
    if filtered_active:
        best = max(filtered_active, key=lambda x: x["latest_pnl_percent"])
        worst = min(filtered_active, key=lambda x: x["latest_pnl_percent"])
        user_metrics.update({
            "best_performer": {"symbol": best["symbol"], "pl_pct": round(best["latest_pnl_percent"], 2)},
            "worst_performer": {"symbol": worst["symbol"], "pl_pct": round(worst["latest_pnl_percent"], 2)}
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
            "watchlist": filtered_active,
            "performanceTrend": performance_trend
        },
        "filters": {
            "category": category,
            "timeframe": timeframe
        },
        "lastUpdated": _global_cache["last_updated"].isoformat()
    }
