import yfinance as yf
from sqlalchemy.orm import Session
from app.models.portfolio import PortfolioHolding
from app.services import market_service
from typing import List, Dict, Any
import asyncio

class PortfolioService:
    async def get_portfolio_summary(self, db: Session, user_id: int):
        holdings = db.query(PortfolioHolding).filter(
            PortfolioHolding.user_id == user_id,
            PortfolioHolding.is_active == True
        ).all()
        
        if not holdings:
            return self._empty_summary()

        # Batch fetch live prices
        symbols = [h.symbol for h in holdings]
        yf_symbols = [f"{s}.NS" if not (".NS" in s or ".BO" in s) else s for s in symbols]
        
        try:
            # Using market_service fetch for efficiency if possible, or direct yf
            data = yf.download(yf_symbols, period="1d", interval="1m", progress=False, group_by='ticker')
            
            prices = {}
            for sym, yf_sym in zip(symbols, yf_symbols):
                try:
                    if len(holdings) > 1:
                        ticker_data = data[yf_sym]
                    else:
                        ticker_data = data
                    prices[sym] = float(ticker_data['Close'].iloc[-1])
                except:
                    prices[sym] = 0.0
        except Exception as e:
            print(f"Portfolio price fetch error: {e}")
            prices = {s: 0.0 for s in symbols}

        processed_holdings = []
        total_invested = 0
        total_value = 0
        
        # Calculate individual metrics
        for h in holdings:
            lp = prices.get(h.symbol, 0.0)
            invested = h.quantity * h.avg_price
            current_val = h.quantity * lp
            pnl = current_val - invested
            pnl_pct = (pnl / invested * 100) if invested > 0 else 0
            
            total_invested += invested
            total_value += current_val
            
            processed_holdings.append({
                "id": h.id,
                "user_id": h.user_id,
                "symbol": h.symbol,
                "company_name": h.company_name,
                "sector": h.sector or "Others",
                "quantity": h.quantity,
                "avg_price": h.avg_price,
                "current_price": lp,
                "pnl": pnl,
                "pnl_percent": pnl_pct,
                "weight": 0.0 # Calculate after total
            })

        # Calculate weights and sector allocation
        sector_map = {}
        for h in processed_holdings:
            val = h["quantity"] * h["current_price"]
            weight = (val / total_value * 100) if total_value > 0 else 0
            h["weight"] = round(weight, 2)
            
            s = h["sector"]
            sector_map[s] = sector_map.get(s, 0) + val

        sector_allocation = [
            {"name": name, "value": round((val / total_value * 100), 1) if total_value > 0 else 0}
            for name, val in sector_map.items()
        ]

        total_pnl = total_value - total_invested
        total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0

        # Simple AI suggestions (Mock for now, can use LLM later)
        suggestions = self._generate_suggestions(processed_holdings)

        return {
            "total_invested": round(total_invested, 2),
            "total_value": round(total_value, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_percent": round(total_pnl_pct, 2),
            "holdings_count": len(holdings),
            "risk_score": 65.5, # Static for now
            "holdings": processed_holdings,
            "sector_allocation": sector_allocation,
            "rebalance_suggestions": suggestions
        }

    def _generate_suggestions(self, holdings):
        tips = []
        for h in holdings:
            if h["weight"] > 25:
                tips.append({
                    "symbol": h["symbol"],
                    "action": "Trim",
                    "reason": f"Concentration risk: {h['weight']}% is high for a single holding.",
                    "tone": "warning"
                })
            elif h["pnl_percent"] < -15:
                tips.append({
                    "symbol": h["symbol"],
                    "action": "Review",
                    "reason": "Deep drawdown detected. Check if fundamentals changed or exit if SL reached.",
                    "tone": "danger"
                })
        
        if not tips:
            tips.append({
                "symbol": "SYSTEM",
                "action": "Healthy",
                "reason": "Portfolio is well balanced with no immediate risks detected.",
                "tone": "success"
            })
        return tips

    def _empty_summary(self):
        return {
            "total_invested": 0,
            "total_value": 0,
            "total_pnl": 0,
            "total_pnl_percent": 0,
            "holdings_count": 0,
            "risk_score": 0,
            "holdings": [],
            "sector_allocation": [],
            "rebalance_suggestions": []
        }

portfolio_service = PortfolioService()
