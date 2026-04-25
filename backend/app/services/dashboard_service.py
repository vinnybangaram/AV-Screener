from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
import asyncio
from app.services import market_service, news_service, notification_service, watchlist_service, snapshot_service, llm_service
from app.dashboard.engine import DashboardEngine
from app.utils.cache import market_cache

async def get_dashboard_data(db: Session, user_id: int, category: str = "All", timeframe: str = "This Month") -> Dict[str, Any]:
    """
    Aggregates global market intelligence and personalized user data using DashboardEngine.
    """
    now = datetime.utcnow()
    
    # 1. Global Market Data (Cached for 5 mins)
    global_data = market_cache.get("dashboard_global_agg")
    last_updated = market_cache.get("dashboard_global_last_updated")
    
    if not global_data:
        movers_task = market_service.get_top_movers()
        news_task = asyncio.to_thread(news_service.get_market_news)
        context_task = market_service.get_market_context()
        sector_task = market_service.get_sector_performance()
        
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
        
        global_data["aiInsight"] = await asyncio.to_thread(llm_service.get_market_insight, global_data)
        
        last_updated = now
        market_cache.set("dashboard_global_agg", global_data, ttl=300)
        market_cache.set("dashboard_global_last_updated", last_updated, ttl=300)

    # 2. Personalized User Data using DashboardEngine
    # Map high-level category to tab/subTab for Engine
    tab = "intraday" if "intraday" in category.lower() else "investment"
    filter_type = timeframe.lower().replace("this ", "")
    if filter_type not in ["today", "week", "month", "year"]:
        filter_type = "month"

    # Map category to sub_tab
    sub_tab_map = {
        "Multibaggers": "multibagger", "Penny Stocks": "penny", "Core Portfolio": "core",
        "Intraday Longs": "longs", "Intraday Shorts": "shorts", "All": "all",
        "Investment": "all", "Intraday Radar": "all"
    }
    sub_tab = sub_tab_map.get(category, "all")

    # Fetch summary for BOTH tabs
    inv_summary_task = DashboardEngine.get_summary(db, user_id, "investment", filter_type, sub_tab if tab == "investment" else "all")
    intra_summary_task = DashboardEngine.get_summary(db, user_id, "intraday", filter_type, sub_tab if tab == "intraday" else "all")
    stocks_task = DashboardEngine.get_stocks(db, user_id, tab, sub_tab)
    
    perf_task = DashboardEngine.get_best_worst_performers(db, user_id, tab, sub_tab)
    notifs_task = asyncio.to_thread(notification_service.get_user_notifications, db, user_id)
    trend_task = asyncio.to_thread(snapshot_service.get_performance_trend, db, user_id, category, timeframe)

    inv_summary, intra_summary, watchlist, performance, notifications, trend = await asyncio.gather(
        inv_summary_task, intra_summary_task, stocks_task, perf_task, notifs_task, trend_task
    )

    # Consolidated Metrics Profile
    current_tab_summary = intra_summary if tab == "intraday" else inv_summary
    
    user_metrics = {
        "total_value": current_tab_summary.get("totalValue", 0),
        "total_pl_abs": current_tab_summary.get("overallPnL", 0),
        "total_pnl_pct": current_tab_summary.get("pnlPct", 0),
        "today_pl_abs": current_tab_summary.get("dayPnL", 0),
        "count": current_tab_summary.get("totalStocks", 0),
        "best_performer": performance.get("best"),
        "worst_performer": performance.get("worst"),
        "investment": {
            "dayPnL": inv_summary.get("dayPnL", 0),
            "overallPnL": inv_summary.get("overallPnL", 0),
            "totalValue": inv_summary.get("totalValue", 0)
        },
        "intraday": {
            "todayPnL": intra_summary.get("dayPnL", 0),
            "weekPnL": intra_summary.get("overallPnL", 0) if filter_type == "week" else 0,
            "monthPnL": intra_summary.get("overallPnL", 0) if filter_type == "month" else 0,
            "overallPnL": intra_summary.get("overallPnL", 0)
        }
    }

    formatted_notifs = [
        {
            "id": n.id, "message": n.message, "type": n.type, "priority": n.priority,
            "symbol": n.symbol, "timestamp": n.created_at.isoformat()
        } for n in notifications[:10]
    ]

    user_final_data = {
        "metrics": user_metrics,
        "notifications": formatted_notifs,
        "watchlist": watchlist,
        "performanceTrend": trend
    }

    return {
        "global": global_data,
        "user": user_final_data,
        "filters": {"category": category, "timeframe": timeframe},
        "lastUpdated": last_updated.isoformat() if last_updated else now.isoformat()
    }
