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
            self.sessions[user_id] = {
                "running": False,
                "budget": 200000,
                "stock_count": 5,
                "risk_mode": "Balanced",
                "active_trades": [],
                "history": [],
                "last_scan": None
            }
        return self.sessions[user_id]

    async def get_signals(self, user_id: int) -> List[Dict[str, Any]]:
        """Generates real-time signals using Top Movers and Sector strength."""
        movers = await market_service.get_top_movers()
        gainers = movers.get("gainers", [])
        
        signals = []
        for g in gainers[:10]:
            # Map ticker DB for sector info
            ticker_info = next((item for item in TICKER_DB if item["symbol"] == g["symbol"]), {})
            
            signals.append({
                "symbol": g["symbol"],
                "company": ticker_info.get("company", "Company Node"),
                "sector": ticker_info.get("sector", "Other"),
                "entry": g["price"] * 0.995, # Simulated entry
                "current": g["price"],
                "changePct": g["change_pct"],
                "confidence": g.get("momentum_score", random.randint(70, 95)),
                "signal": "Breakout" if g["change_pct"] > 1.5 else "Momentum",
                "status": "Triggered" if g["change_pct"] > 2.0 else "Ready"
            })
            
        return sorted(signals, key=lambda x: x["confidence"], reverse=True)

    async def get_engine_state(self, user_id: int):
        session = self.get_session(user_id)
        
        # If running, simulate price updates for active trades
        if session["running"]:
            await self._update_active_trades(session)
            
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
            for s in signals[:session["stock_count"]]:
                qty = int((session["budget"] / session["stock_count"]) / s["current"])
                session["active_trades"].append({
                    "id": f"t_{s['symbol']}_{random.randint(1000,9999)}",
                    "symbol": s["symbol"],
                    "buy": s["current"],
                    "qty": qty,
                    "current": s["current"],
                    "pnl": 0.0,
                    "pnlPct": 0.0,
                    "sl": s["current"] * 0.985,
                    "target": s["current"] * 1.03,
                    "status": "Running"
                })
        
        return await self.get_engine_state(user_id)

    async def _update_active_trades(self, session):
        """Simulates price movement and exits for active trades."""
        symbols = [t["symbol"] for t in session["active_trades"]]
        if not symbols: return
        
        prices = await market_service.get_daily_changes(symbols)
        
        remaining = []
        for t in session["active_trades"]:
            symbol = t["symbol"]
            curr_data = prices.get(symbol)
            
            if curr_data:
                # Add a bit of 'Live' jitter
                import random
                price = curr_data["latest_price"] * (1 + random.uniform(-0.0005, 0.0005))
                t["current"] = round(price, 2)
                t["pnl"] = round((t["current"] - t["buy"]) * t["qty"], 2)
                t["pnlPct"] = round(((t["current"] - t["buy"]) / t["buy"]) * 100, 2)
                
                # Exit logic (SL or Target)
                if t["current"] <= t["sl"] or t["current"] >= t["target"]:
                    session["history"].append({
                        "id": f"h_{t['symbol']}_{random.randint(1000,9999)}",
                        "time": datetime.now().strftime("%H:%M:%S"),
                        "symbol": t["symbol"],
                        "sector": next((item["sector"] for item in TICKER_DB if item["symbol"] == t["symbol"]), "Other"),
                        "entry": t["buy"],
                        "exit": t["current"],
                        "qty": t["qty"],
                        "invested": t["buy"] * t["qty"],
                        "pnl": t["pnl"],
                        "pnlPct": t["pnlPct"],
                        "status": "Profit" if t["pnl"] > 0 else "Loss",
                        "reason": "Target Hit" if t["current"] >= t["target"] else "Stop Loss Hit"
                    })
                else:
                    remaining.append(t)
            else:
                remaining.append(t)
                
        session["active_trades"] = remaining

    async def reset_day(self, user_id: int):
        if user_id in self.sessions:
            del self.sessions[user_id]
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
            "momentum_score": m.get("momentum_score", 0)
        })
        
    # 3. Map Losers to Shorts
    shorts = []
    for m in movers.get("losers", []):
        shorts.append({
            "ticker": m["symbol"],
            "price": m["price"],
            "change_pct": m["change_pct"],
            "momentum_score": m.get("momentum_score", 0)
        })
        
    return {
        "longs": sorted(longs, key=lambda x: x["change_pct"], reverse=True)[:5],
        "shorts": sorted(shorts, key=lambda x: x["change_pct"])[:5]
    }
