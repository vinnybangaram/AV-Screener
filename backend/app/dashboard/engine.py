import asyncio
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.watchlist import WatchlistPosition
from app.models.daily_price import StockDailyPrice
from app.models.intraday_history import IntradayHistory
from app.models.dashboard_cache import DashboardCache
from app.services import market_service, watchlist_service
from app.utils.config import settings

class DashboardEngine:
    @staticmethod
    def _get_start_date(filter_type: str) -> datetime:
        now = datetime.utcnow()
        if filter_type == "today":
            return datetime(now.year, now.month, now.day)
        elif filter_type == "week":
            return now - timedelta(days=now.weekday())
        elif filter_type == "month":
            return datetime(now.year, now.month, 1)
        elif filter_type == "year":
            return datetime(now.year, 1, 1)
        return now - timedelta(days=30)

    @staticmethod
    async def get_summary(db: Session, user_id: int, tab: str, filter_type: str, sub_tab: str = "all") -> Dict[str, Any]:
        """
        Returns summary metrics for the given tab, filter, and sub_tab.
        Uses cache if available and fresh.
        """
        cache_key = f"{tab}_{sub_tab}"
        cache = db.query(DashboardCache).filter(
            DashboardCache.user_id == user_id,
            DashboardCache.tab == cache_key,
            DashboardCache.filter_type == filter_type
        ).first()
        
        # 5 minute cache for summary
        if cache and (datetime.utcnow() - cache.updated_at).total_seconds() < 300:
            return cache.metrics_json

        metrics = await DashboardEngine._calculate_metrics(db, user_id, tab, filter_type, sub_tab)
        
        if cache:
            cache.metrics_json = metrics
            cache.updated_at = datetime.utcnow()
        else:
            new_cache = DashboardCache(
                user_id=user_id,
                tab=cache_key,
                filter_type=filter_type,
                metrics_json=metrics
            )
            db.add(new_cache)
        
        try:
            db.commit()
        except:
            db.rollback()
        
        return metrics

    @staticmethod
    async def _calculate_metrics(db: Session, user_id: int, tab: str, filter_type: str, sub_tab: str = "all") -> Dict[str, Any]:
        start_date = DashboardEngine._get_start_date(filter_type)
        
        if tab == "investment":
            from sqlalchemy import or_
            query = db.query(WatchlistPosition).filter(
                WatchlistPosition.user_id == user_id,
                WatchlistPosition.is_active == True,
            )
            # Apply sub-tab filter
            if sub_tab in ("multibagger", "multibaggers"):
                query = query.filter(WatchlistPosition.category.ilike("%multibagger%"))
            elif sub_tab in ("penny", "pennystocks"):
                query = query.filter(WatchlistPosition.category.ilike("%penny%"))
            elif sub_tab in ("core", "coreportfolio"):
                query = query.filter(WatchlistPosition.category.ilike("%core%"))
            else:
                # "all" — all investment categories
                query = query.filter(or_(
                    WatchlistPosition.category.ilike("%multibagger%"),
                    WatchlistPosition.category.ilike("%penny%"),
                    WatchlistPosition.category.ilike("%core%"),
                    WatchlistPosition.category.ilike("%investment%")
                ))
            positions = query.all()
            
            if not positions:
                return {"totalStocks": 0, "dayPnL": 0, "overallPnL": 0, "winRate": 0, "totalValue": 0}
            
            symbols = [p.symbol for p in positions]
            prices = await market_service.get_daily_changes(symbols)
            
            total_day_pnl = 0.0
            total_overall_pnl = 0.0
            total_value = 0.0
            wins = 0
            
            for p in positions:
                price_data = prices.get(p.symbol, {})
                qty = p.quantity or 1
                entry_pr = p.entry_price or 0.0
                curr_pr = p.latest_price or entry_pr
                current_price = price_data.get("latest_price", curr_pr)
                day_change_abs = price_data.get("today_change_abs", 0.0)
                
                day_pnl = day_change_abs * qty
                overall_pnl = (current_price - entry_pr) * qty
                
                total_day_pnl += day_pnl
                total_overall_pnl += overall_pnl
                total_value += current_price * qty
                if overall_pnl > 0:
                    wins += 1
            
            return {
                "totalStocks": len(positions),
                "totalValue": round(total_value, 2),
                "dayPnL": round(total_day_pnl, 2),
                "overallPnL": round(total_overall_pnl, 2),
                "sumDayPnL": round(total_day_pnl, 2),
                "sumOverallPnL": round(total_overall_pnl, 2),
                "winRate": round((wins / len(positions)) * 100, 2) if positions else 0
            }
            
        else: # intraday — always use live positions
            query = db.query(WatchlistPosition).filter(
                WatchlistPosition.user_id == user_id,
                WatchlistPosition.category.ilike("%intraday%"),
                WatchlistPosition.is_active == True
            )
            # Filter by long/short sub_tab
            if sub_tab == "longs":
                query = query.filter(func.lower(func.coalesce(WatchlistPosition.sub_type, WatchlistPosition.side, "long")) != "short")
            elif sub_tab == "shorts":
                query = query.filter(func.lower(func.coalesce(WatchlistPosition.sub_type, WatchlistPosition.side, "long")) == "short")
            positions = query.all()
            
            if not positions:
                return {"totalStocks": 0, "dayPnL": 0, "overallPnL": 0, "winRate": 0, "totalValue": 0}
            
            symbols = [p.symbol for p in positions]
            prices = await market_service.get_daily_changes(symbols)
            
            total_pnl = 0.0
            total_value = 0.0
            total_day_pnl = 0.0
            wins = 0
            
            for p in positions:
                price_data = prices.get(p.symbol, {})
                qty = p.quantity or 1
                entry_pr = p.entry_price or 0.0
                curr_pr = p.latest_price or entry_pr
                curr = price_data.get("latest_price", curr_pr)
                day_change = price_data.get("today_change_abs", 0.0)
                
                trade_type = (p.sub_type or p.side or "long").lower()
                # Per user spec: Long P&L = (Current - Entry), Short P&L = (Entry - Current)
                if trade_type == "short":
                    pnl_unit = entry_pr - curr
                else:
                    pnl_unit = curr - entry_pr
                
                pnl = pnl_unit * qty
                total_pnl += pnl           # overall PnL = sum of all per-stock P&L
                total_day_pnl += (day_change * qty)  # day PnL = sum of daily price changes
                total_value += (curr * qty)
                if pnl > 0:
                    wins += 1
            
            return {
                "totalStocks": len(positions),
                "totalValue": round(total_value, 2),
                "dayPnL": round(total_day_pnl, 2),
                "overallPnL": round(total_pnl, 2),
                "sumDayPnL": round(total_day_pnl, 2),
                "sumOverallPnL": round(total_pnl, 2),
                "winRate": round((wins / len(positions)) * 100, 2) if positions else 0
            }

    @staticmethod
    async def get_stocks(db: Session, user_id: int, tab: str, sub_tab: str) -> List[Dict[str, Any]]:
        query = db.query(WatchlistPosition).filter(
            WatchlistPosition.user_id == user_id,
            WatchlistPosition.is_active == True
        )
        
        if tab == "investment":
            query = query.filter(WatchlistPosition.category.notilike("%intraday%"))
            if sub_tab == "multibagger" or sub_tab == "multibaggers":
                query = query.filter(WatchlistPosition.category.ilike("%multibagger%"))
            elif sub_tab == "penny" or sub_tab == "pennystocks":
                query = query.filter(WatchlistPosition.category.ilike("%penny%"))
            elif sub_tab == "core" or sub_tab == "coreportfolio":
                query = query.filter(WatchlistPosition.category.ilike("%core%"))
        else: # intraday
            query = query.filter(WatchlistPosition.category.ilike("%intraday%"))
            if sub_tab == "longs":
                query = query.filter(func.lower(func.coalesce(WatchlistPosition.sub_type, WatchlistPosition.side)) == "long")
            elif sub_tab == "shorts":
                query = query.filter(func.lower(func.coalesce(WatchlistPosition.sub_type, WatchlistPosition.side)) == "short")
                
        positions = query.all()
        if not positions:
            return []
            
        symbols = [p.symbol for p in positions]
        prices = await market_service.get_daily_changes(symbols)
        
        results = []
        for p in positions:
            price_data = prices.get(p.symbol, {})
            entry_pr = p.entry_price or 0.0
            curr_pr = p.latest_price or entry_pr
            curr = price_data.get("latest_price", curr_pr)
            day_change = price_data.get("today_change_abs", 0.0)
            
            is_intraday = "intraday" in (p.category or "").lower()
            trade_type = (p.sub_type or p.side or "long").lower() if is_intraday else None
            
            if is_intraday:
                if trade_type == "short":
                    pnl_unit = (entry_pr - curr)
                else:
                    pnl_unit = (curr - entry_pr)
            else:
                pnl_unit = (curr - entry_pr)
            
            qty = p.quantity or 1
            pnl_total = pnl_unit * qty
            pnl_pct = (pnl_unit / entry_pr * 100) if entry_pr > 0 else 0.0
            day_pnl = day_change * qty
            
            stock_data = {
                "id": p.id,
                "symbol": p.symbol,
                "company_name": p.company_name or p.symbol,
                "category": p.category,
                "added_at": p.added_at.isoformat() if p.added_at else None,
                "entry_price": round(entry_pr, 2),
                "latest_price": round(curr, 2),
                "stop_loss": round(p.stop_loss, 2) if p.stop_loss else 0,
                "target_price": round(p.target_price, 2) if p.target_price else 0,
                "latest_pnl": round(pnl_unit, 2),
                "latest_pnl_percent": round(pnl_pct, 2),
                "day_pnl": round(day_pnl, 2),
                "day_change_pct": price_data.get("today_change_pct", 0),
                "quantity": qty,
                "is_active": p.is_active,
                "status": p.status or "ACTIVE",
                "expires_at": p.expires_at.isoformat() if p.expires_at else None
            }
            
            # Only include side/tradeType for intraday stocks
            if is_intraday:
                stock_data["side"] = (p.side or "LONG").upper()
                stock_data["tradeType"] = trade_type
                stock_data["sub_type"] = p.sub_type
            
            results.append(stock_data)
            
        return results

    @staticmethod
    async def get_best_worst_performers(db: Session, user_id: int, tab: str = "investment", sub_tab: str = "all") -> Dict[str, Any]:
        from sqlalchemy import or_
        query = db.query(WatchlistPosition).filter(
            WatchlistPosition.user_id == user_id,
            WatchlistPosition.is_active == True
        )
        
        if tab == "investment":
            if sub_tab in ("multibagger", "multibaggers"):
                query = query.filter(WatchlistPosition.category.ilike("%multibagger%"))
            elif sub_tab in ("penny", "pennystocks"):
                query = query.filter(WatchlistPosition.category.ilike("%penny%"))
            elif sub_tab in ("core", "coreportfolio"):
                query = query.filter(WatchlistPosition.category.ilike("%core%"))
            else:
                query = query.filter(or_(
                    WatchlistPosition.category.ilike("%multibagger%"),
                    WatchlistPosition.category.ilike("%penny%"),
                    WatchlistPosition.category.ilike("%core%"),
                    WatchlistPosition.category.ilike("%investment%")
                ))
        else:
            query = query.filter(WatchlistPosition.category.ilike("%intraday%"))
        
        positions = query.all()
        if not positions:
            return {"best": None, "worst": None}
            
        symbols = [p.symbol for p in positions]
        prices = await market_service.get_daily_changes(symbols)
        
        perf = []
        for p in positions:
            price_data = prices.get(p.symbol, {})
            entry_pr = p.entry_price or 0.0
            curr_pr = p.latest_price or entry_pr
            curr = price_data.get("latest_price", curr_pr)
            pnl_pct = ((curr - entry_pr) / entry_pr * 100) if entry_pr > 0 else 0.0
            perf.append({"symbol": p.symbol, "pl_pct": round(pnl_pct, 2)})
            
        perf.sort(key=lambda x: x["pl_pct"], reverse=True)
        
        return {
            "best": perf[0] if perf else None,
            "worst": perf[-1] if perf else None,
            "winLossRatio": sum(1 for x in perf if x["pl_pct"] > 0) / len(perf) if perf else 0
        }
