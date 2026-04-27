import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.services import market_service
from app.data.ticker_db import TICKER_DB

class IntradayService:
    def __init__(self):
        self.engine_status = "Idle"
        self.running = False
        self.budget = 200000
        self.stock_count = 5
        self.risk_mode = "Balanced"
        
        # In-memory storage for active sessions (simulated)
        # In a production app, this would be in a DB, but for "Functional UI" 
        # with these constraints, we'll maintain a per-user session proxy.
        self.sessions = {}

    def get_session(self, user_id: int):
        if user_id not in self.sessions:
            # Initialize with default values
            self.sessions[user_id] = {
                "running": False,
                "budget": 200000,
                "stock_count": 5,
                "risk_mode": "Balanced",
                "active_trades": [],
                "history": [],
                "last_scan": None
            }
            
            # ATTEMPT TO RESTORE FROM DATABASE (Persistence)
            try:
                from app.database import SessionLocal
                from app.models.watchlist import WatchlistPosition
                db = SessionLocal()
                positions = db.query(WatchlistPosition).filter(
                    WatchlistPosition.user_id == user_id,
                    WatchlistPosition.category == "intraday"
                ).all()
                
                for p in positions:
                    is_buy = (p.side == "LONG" or p.sub_type == "long")
                    trade = {
                        "id": f"db_{p.id}",
                        "symbol": p.symbol,
                        "entry": p.entry_price or 0.0,
                        "side": "BUY" if is_buy else "SELL",
                        "qty": p.quantity or 1,
                        "current": p.latest_price or p.entry_price or 0.0,
                        "pnl": p.latest_pnl or 0.0,
                        "pnlPct": p.latest_pnl_percent or 0.0,
                        "sl": p.stop_loss or (p.entry_price * 0.985 if is_buy else p.entry_price * 1.015),
                        "target": p.target_price or (p.entry_price * 1.03 if is_buy else p.entry_price * 0.97),
                        "status": "Running"
                    }
                    self.sessions[user_id]["active_trades"].append(trade)
                
                # If we have active trades, assume the engine should be "running"
                if self.sessions[user_id]["active_trades"]:
                    self.sessions[user_id]["running"] = True
                
                db.close()
            except Exception as e:
                print(f"Error restoring intraday session for user {user_id}: {e}")
                
        return self.sessions[user_id]

    async def get_signals(self, user_id: int) -> List[Dict[str, Any]]:
        """Generates real-time signals using Top Movers and Sector strength."""
        movers = await market_service.get_top_movers()
        gainers = movers.get("gainers", [])
        losers = movers.get("losers", [])
        
        signals = []
        
        # Process Longs (Gainers)
        for g in gainers[:5]:
            ticker_info = next((item for item in TICKER_DB if item["symbol"] == g["symbol"]), {})
            
            # Clip entry to Day Low to ensure realistic data
            raw_entry = g["price"] * 0.995
            day_low = g.get("low", raw_entry)
            entry = max(raw_entry, day_low)
            
            signals.append({
                "symbol": g["symbol"],
                "company": ticker_info.get("company", "Company Node"),
                "sector": ticker_info.get("sector", "Other"),
                "entry": round(entry, 2),
                "current": g["price"],
                "changePct": g["change_pct"],
                "confidence": g.get("momentum_score", random.randint(75, 95)),
                "side": "BUY",
                "signal": "Breakout" if g["change_pct"] > 1.5 else "Momentum",
                "status": "Triggered" if g["change_pct"] > 2.0 else "Ready"
            })
            
        # Process Shorts (Losers)
        for l in losers[:5]:
            ticker_info = next((item for item in TICKER_DB if item["symbol"] == l["symbol"]), {})
            
            # Clip entry to Day High
            raw_entry = l["price"] * 1.005
            day_high = l.get("high", raw_entry)
            entry = min(raw_entry, day_high)
            
            signals.append({
                "symbol": l["symbol"],
                "company": ticker_info.get("company", "Company Node"),
                "sector": ticker_info.get("sector", "Other"),
                "entry": round(entry, 2),
                "current": l["price"],
                "changePct": l["change_pct"],
                "confidence": l.get("momentum_score", random.randint(75, 95)),
                "side": "SELL",
                "signal": "Breakdown" if l["change_pct"] < -1.5 else "Momentum",
                "status": "Triggered" if l["change_pct"] < -2.0 else "Ready"
            })
            
        return sorted(signals, key=lambda x: x["confidence"], reverse=True)

    async def get_engine_state(self, user_id: int):
        session = self.get_session(user_id)
        
        # If running, simulate price updates for active trades
        if session["running"]:
            await self._update_active_trades(user_id, session)
            
        return {
            "running": session["running"],
            "budget": session["budget"],
            "stock_count": session["stock_count"],
            "risk_mode": session["risk_mode"],
            "active_trades": session["active_trades"],
            "history": session["history"],
            "day_pnl": sum(t["pnl"] for t in session["active_trades"]) + sum(h["pnl"] for h in session["history"])
        }

    async def toggle_engine(self, user_id: int, config: Dict[str, Any]):
        session = self.get_session(user_id)
        session["running"] = config.get("running", not session["running"])
        session["budget"] = config.get("budget", session["budget"])
        session["stock_count"] = config.get("stock_count", session["stock_count"])
        session["risk_mode"] = config.get("risk_mode", session["risk_mode"])
        
        if session["running"] and not session["active_trades"]:
            # Initial seed of trades if none exist
            signals = await self.get_signals(user_id)
            
            from app.database import SessionLocal
            from app.models.watchlist import WatchlistPosition
            db = SessionLocal()
            
            try:
                # 1. Fetch ABSOLUTE LATEST prices for the selected symbols to avoid "dodged" data
                selected_symbols = [s["symbol"] for s in signals[:session["stock_count"]]]
                latest_prices = await market_service.get_daily_changes(selected_symbols)
                
                # 2. Pick best signals and execute at fresh price
                for s in signals[:session["stock_count"]]:
                    sym = s["symbol"]
                    # Use latest price if available, fallback to signal price only if fetch fails
                    entry_price = latest_prices.get(sym, {}).get("latest_price", s["current"])
                    
                    qty = int((session["budget"] / session["stock_count"]) / entry_price)
                    is_buy = s["side"] == "BUY"
                    side_db = "long" if is_buy else "short"
                    
                    trade = {
                        "id": f"t_{sym}_{random.randint(1000,9999)}",
                        "symbol": sym,
                        "entry": entry_price,
                        "side": s["side"],
                        "qty": qty,
                        "current": entry_price,
                        "pnl": 0.0,
                        "pnlPct": 0.0,
                        "sl": entry_price * (0.985 if is_buy else 1.015),
                        "target": entry_price * (1.03 if is_buy else 0.97),
                        "status": "Running"
                    }
                    session["active_trades"].append(trade)
                    
                    # Sync with Database for Dashboard accuracy
                    new_pos = WatchlistPosition(
                        user_id=user_id,
                        symbol=sym,
                        company_name=s["company"],
                        category="intraday",
                        sub_type=side_db,
                        side=side_db.upper(),
                        entry_price=entry_price,
                        quantity=qty,
                        is_auto_generated=True,
                        latest_price=entry_price,
                        latest_pnl=0.0,
                        latest_pnl_percent=0.0,
                        stop_loss=trade["sl"],
                        target_price=trade["target"]
                    )
                    db.add(new_pos)
                    
                    # Trigger Notification
                    from .notification_service import trigger_notification
                    trigger_notification(
                        db=db,
                        user_id=user_id,
                        symbol=s["symbol"],
                        message=f"Intraday Execution: {'Bought' if is_buy else 'Sold'} {s['symbol']} @ ₹{s['current']}",
                        type="TRADE_ENTRY",
                        priority="MEDIUM"
                    )
                db.commit()
            except Exception as e:
                print(f"Intraday Toggle Engine Sync Error: {e}")
                db.rollback()
            finally:
                db.close()
        
        return await self.get_engine_state(user_id)

    async def _update_active_trades(self, user_id, session):
        """Simulates price movement and exits for active trades."""
        symbols = [t["symbol"] for t in session["active_trades"]]
        if not symbols: return
        
        prices = await market_service.get_daily_changes(symbols)
        
        from app.database import SessionLocal
        from app.models.watchlist import WatchlistPosition
        db = SessionLocal()
        
        try:
            remaining = []
            for t in session["active_trades"]:
                symbol = t["symbol"]
                curr_data = prices.get(symbol)
                is_buy = t.get("side", "BUY") == "BUY"
                
                if curr_data:
                    # Add a bit of 'Live' jitter
                    import random
                    price = curr_data["latest_price"] * (1 + random.uniform(-0.0005, 0.0005))
                    t["current"] = round(price, 2)
                    
                    # Correct P&L calculation for both sides
                    diff = (t["current"] - t["entry"]) if is_buy else (t["entry"] - t["current"])
                    t["pnl"] = round(diff * t["qty"], 2)
                    t["pnlPct"] = round((diff / t["entry"]) * 100, 2)
                    
                    # Update DB for dashboard
                    db.query(WatchlistPosition).filter(
                        WatchlistPosition.user_id == user_id,
                        WatchlistPosition.symbol == symbol,
                        WatchlistPosition.category == "intraday"
                    ).update({
                        "latest_price": t["current"],
                        "latest_pnl": t["pnl"],
                        "latest_pnl_percent": t["pnlPct"]
                    })
                    
                    # Exit logic (SL or Target)
                    triggered = False
                    if is_buy:
                        triggered = t["current"] <= t["sl"] or t["current"] >= t["target"]
                    else:
                        triggered = t["current"] >= t["sl"] or t["current"] <= t["target"]

                    if triggered:
                        history_item = {
                            "id": f"h_{t['symbol']}_{random.randint(1000,9999)}",
                            "time": datetime.now().strftime("%H:%M:%S"),
                            "symbol": t["symbol"],
                            "side": t.get("side", "BUY"),
                            "sector": next((item["sector"] for item in TICKER_DB if item["symbol"] == t["symbol"]), "Other"),
                            "entry": t["entry"],
                            "exit": t["current"],
                            "qty": t["qty"],
                            "invested": t["entry"] * t["qty"],
                            "pnl": t["pnl"],
                            "pnlPct": t["pnlPct"],
                            "status": "Profit" if t["pnl"] > 0 else "Loss",
                            "reason": "Target Hit" if (t["current"] >= t["target"] if is_buy else t["current"] <= t["target"]) else "Stop Loss Hit"
                        }
                        session["history"].append(history_item)

                        # Remove from Dashboard/DB
                        db.query(WatchlistPosition).filter(
                            WatchlistPosition.user_id == user_id,
                            WatchlistPosition.symbol == symbol,
                            WatchlistPosition.category == "intraday"
                        ).delete()

                        # Trigger Notification for Exit
                        from .notification_service import trigger_notification
                        pnl_str = f"₹{history_item['pnl']}" if history_item['pnl'] >= 0 else f"-₹{abs(history_item['pnl'])}"
                        trigger_notification(
                            db=db,
                            user_id=user_id,
                            symbol=t["symbol"],
                            message=f"Intraday Exit: {t['symbol']} closed @ ₹{t['current']}. Result: {pnl_str} ({t['pnlPct']}%)",
                            type="TRADE_EXIT",
                            priority="MEDIUM"
                        )
                    else:
                        remaining.append(t)
                else:
                    remaining.append(t)
            
            db.commit()
            session["active_trades"] = remaining
        except Exception as e:
            print(f"Intraday Sync Error: {e}")
            db.rollback()
        finally:
            db.close()

    async def reset_day(self, user_id: int):
        if user_id in self.sessions:
            del self.sessions[user_id]
            
        # Also clear DB for this user
        from app.database import SessionLocal
        from app.models.watchlist import WatchlistPosition
        db = SessionLocal()
        try:
            db.query(WatchlistPosition).filter(
                WatchlistPosition.user_id == user_id,
                WatchlistPosition.category == "intraday"
            ).delete()
            db.commit()
        except:
            db.rollback()
        finally:
            db.close()
            
        return await self.get_engine_state(user_id)

intraday_service = IntradayService()

async def run_intraday_scan():
    """
    Core scanning logic used by background jobs.
    Analyzes top movers and returns high-conviction longs and shorts.
    """
    # 1. Fetch live top movers
    movers = await market_service.get_top_movers()
    
    # 2. Map Gainers to Longs
    longs = []
    for m in movers.get("gainers", []):
        longs.append({
            "ticker": m["symbol"],
            "price": m["price"],
            "change_pct": m["change_pct"],
            "momentum_score": m.get("momentum_score", 0),
            "side": "BUY"
        })
        
    # 3. Map Losers to Shorts
    shorts = []
    for m in movers.get("losers", []):
        shorts.append({
            "ticker": m["symbol"],
            "price": m["price"],
            "change_pct": m["change_pct"],
            "momentum_score": m.get("momentum_score", 0),
            "side": "SELL"
        })
        
    return {
        "longs": sorted(longs, key=lambda x: x["change_pct"], reverse=True)[:5],
        "shorts": sorted(shorts, key=lambda x: x["change_pct"])[:5]
    }
