from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
import asyncio
from app.services import market_service, news_service, notification_service, watchlist_service, snapshot_service, llm_service
from app.utils.cache import market_cache

async def get_dashboard_data(db: Session, user_id: int, category: str = "All", timeframe: str = "This Month") -> Dict[str, Any]:
    """
    Aggregates global market intelligence and personalized user data using a high-performance parallel architecture.
    """
    now = datetime.utcnow()
    
    # Check if global market data is cached
    global_data = market_cache.get("dashboard_global_agg")
    last_updated = market_cache.get("dashboard_global_last_updated")
    
    if not global_data:
        # Fetch global data in parallel
        movers_task = market_service.get_top_movers()
        news_task = asyncio.to_thread(news_service.get_market_news)
        context_task = market_service.get_market_context()
        sector_task = market_service.get_sector_performance()
        
        # Initial gather (without LLM yet as it needs context)
        movers, m_news, m_context, s_perf = await asyncio.gather(
            movers_task, news_task, context_task, sector_task
        )
        
        global_data = {
            "topGainers": movers.get("gainers", []),
            "topLosers": movers.get("losers", []),
            "marketNews": m_news,
            "marketContext": m_context,
            "sectorPerformance": s_perf
        }
        
        # Add AI Insight (Can be slow, but it's separate)
        global_data["aiInsight"] = await asyncio.to_thread(llm_service.get_market_insight, global_data)
        
        last_updated = now
        market_cache.set("dashboard_global_agg", global_data, ttl=300) # 5 min TTL
        market_cache.set("dashboard_global_last_updated", last_updated, ttl=300)

    # 2. Personalized User Data & Metrics
    # Since these are user-specific, we check a short-lived cache
    user_cache_key = f"dash_user_{user_id}_{category}_{timeframe}"
    user_data_cached = market_cache.get(user_cache_key)
    if user_data_cached:
        return {
            "global": global_data,
            "user": user_data_cached,
            "filters": {"category": category, "timeframe": timeframe},
            "lastUpdated": last_updated.isoformat() if last_updated else now.isoformat()
        }

    # Timeframe logic
    def get_start_date(tf):
        now_dt = datetime.utcnow()
        if tf == "Today": return datetime(now_dt.year, now_dt.month, now_dt.day)
        elif tf == "This Week": return now_dt - timedelta(days=now_dt.weekday())
        elif tf == "This Month": return datetime(now_dt.year, now_dt.month, 1)
        elif tf == "This Year": return datetime(now_dt.year, 1, 1)
        return now_dt - timedelta(days=30)

    start_date = get_start_date(timeframe)
    all_watchlist = watchlist_service.get_watchlist(db, user_id, include_inactive=True)
    active_watchlist = [item for item in all_watchlist if item["is_active"]]
    timeframe_watchlist = [item for item in all_watchlist if item["added_at"] >= start_date or item["is_active"]]
    
    filtered_active = active_watchlist
    filtered_timeframe = timeframe_watchlist

    if category != "All":
        cat_map = {
            "Penny Stocks": "penny", "Multibaggers": "multibagger", "Intraday Radar": "intraday",
            "Intraday Longs": "intraday_long", "Intraday Shorts": "intraday_short", "Core Portfolio": "core"
        }
        target_cat = cat_map.get(category, category).lower()
        
        if target_cat == 'investment':
            filtered_active = [item for item in active_watchlist if item["category"].lower() in ("multibagger", "penny")]
            filtered_timeframe = [item for item in timeframe_watchlist if item["category"].lower() in ("multibagger", "penny")]
        elif target_cat == 'intraday_long':
            filtered_active = [item for item in active_watchlist if "intraday" in item["category"].lower() and item["side"] != "SHORT"]
            filtered_timeframe = [item for item in timeframe_watchlist if "intraday" in item["category"].lower() and item["side"] != "SHORT"]
        elif target_cat == 'intraday_short':
            filtered_active = [item for item in active_watchlist if "intraday" in item["category"].lower() and item["side"] == "SHORT"]
            filtered_timeframe = [item for item in timeframe_watchlist if "intraday" in item["category"].lower() and item["side"] == "SHORT"]
        elif target_cat == 'core':
            core_cats = ("core", "investment", "manual")
            filtered_active = [item for item in active_watchlist if item["category"].lower() in core_cats]
            filtered_timeframe = [item for item in timeframe_watchlist if item["category"].lower() in core_cats]
        else:
            filtered_active = [item for item in active_watchlist if target_cat in item["category"].lower()]
            filtered_timeframe = [item for item in timeframe_watchlist if target_cat in item["category"].lower()]

    # Metric calculations
    async def calculate_group_metrics_async(positions):
        if not positions:
            return {
                "total_value": 0, "total_pl_abs": 0, "total_pl_pct": 0, "today_pl_abs": 0, "today_pl_pct": 0, "count": 0,
                "long_pl_abs": 0, "short_pl_abs": 0, "today_long_pl_abs": 0, "today_short_pl_abs": 0
            }
        
        active_pos = [item for item in positions if item["is_active"]]
        total_value = sum(item["latest_price"] * item["quantity"] for item in active_pos)
        total_entry = sum(item["entry_price"] * item["quantity"] for item in positions)
        
        long_pos = [item for item in positions if item["side"] != "SHORT"]
        short_pos = [item for item in positions if item["side"] == "SHORT"]
        
        long_pl_abs = sum(item["latest_pnl"] * item["quantity"] for item in long_pos)
        short_pl_abs = sum(item["latest_pnl"] * item["quantity"] for item in short_pos)
        total_pl_abs = long_pl_abs + short_pl_abs
        total_pl_pct = (total_pl_abs / total_entry) * 100 if total_entry > 0 else 0
        
        active_symbols = [item["symbol"] for item in active_pos]
        daily_changes = await market_service.get_daily_changes(active_symbols) if active_symbols else {}
        
        today_pl_abs, today_long_pl_abs, today_short_pl_abs, total_prev_value = 0, 0, 0, 0
        
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
            "total_value": round(total_value, 2), "total_pl_abs": round(total_pl_abs, 2),
            "long_pl_abs": round(long_pl_abs, 2), "short_pl_abs": round(short_pl_abs, 2),
            "today_long_pl_abs": round(today_long_pl_abs, 2), "today_short_pl_abs": round(today_short_pl_abs, 2),
            "total_pl_pct": round(total_pl_pct, 2), "today_pl_abs": round(today_pl_abs, 2),
            "today_pl_pct": round(today_pl_pct, 2), "count": len(active_pos)
        }

    # Gather metrics and trend in parallel
    intraday_positions_all = [item for item in timeframe_watchlist if "intraday" in item["category"].lower()]
    
    metrics_task = calculate_group_metrics_async(filtered_timeframe)
    intraday_metrics_task = calculate_group_metrics_async(intraday_positions_all)
    trend_task = asyncio.to_thread(snapshot_service.get_performance_trend, db, user_id, category, timeframe)
    notifs_task = asyncio.to_thread(notification_service.get_user_notifications, db, user_id)

    active_metrics, intraday_metrics, performance_trend, notifications = await asyncio.gather(
        metrics_task, intraday_metrics_task, trend_task, notifs_task
    )

    thirty_days_ago = now - timedelta(days=30)
    last_30d_long = sum(i["latest_pnl"] * i["quantity"] for i in all_watchlist if i["added_at"] >= thirty_days_ago and i["side"] != "SHORT")
    last_30d_short = sum(i["latest_pnl"] * i["quantity"] for i in all_watchlist if i["added_at"] >= thirty_days_ago and i["side"] == "SHORT")

    user_metrics = {
        **active_metrics,
        "intraday": intraday_metrics,
        "last_30d_pnl": {
            "long": round(last_30d_long, 2), "short": round(last_30d_short, 2), "total": round(last_30d_long + last_30d_short, 2)
        }
    }
    
    if filtered_active:
        best = max(filtered_active, key=lambda x: x["latest_pnl_percent"])
        worst = min(filtered_active, key=lambda x: x["latest_pnl_percent"])
        user_metrics.update({
            "best_performer": {"symbol": best["symbol"], "pl_pct": round(best["latest_pnl_percent"], 2)},
            "worst_performer": {"symbol": worst["symbol"], "pl_pct": round(worst["latest_pnl_percent"], 2)}
        })

    formatted_notifs = [
        {
            "id": n.id, "message": n.message, "type": n.type, "priority": n.priority,
            "symbol": n.symbol, "timestamp": n.created_at.isoformat()
        } for n in notifications[:10]
    ]

    user_final_data = {
        "metrics": user_metrics,
        "notifications": formatted_notifs,
        "watchlist": filtered_active,
        "performanceTrend": performance_trend
    }
    
    market_cache.set(user_cache_key, user_final_data, ttl=60) # 60s TTL for personal view

    return {
        "global": global_data,
        "user": user_final_data,
        "filters": {"category": category, "timeframe": timeframe},
        "lastUpdated": last_updated.isoformat() if last_updated else now.isoformat()
    }
