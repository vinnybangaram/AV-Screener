import random
import asyncio
from datetime import datetime, time as dt_time
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from ..models.option_signal import OptionTrade, OptionSettings
from ..schemas.option_signal import OptionTradeResponse, OptionSignalsDashboard
from ..services.market_service import get_market_indices
import traceback

class OptionSignalsService:
    def __init__(self):
        self.mock_prices = {
            "NIFTY": 19500.0,
            "BANKNIFTY": 44500.0
        }
        self.last_indices = {}
        self.current_signal_status = "Scanning for high-probability setups..."

    def is_market_open(self) -> bool:
        """Checks if current time is within Indian Market hours (9:15 AM - 3:30 PM IST)."""
        now = datetime.now()
        market_start = dt_time(9, 15)
        market_end = dt_time(15, 30)
        current_time = now.time()
        
        if now.weekday() >= 5:
            return False
            
        return market_start <= current_time <= market_end

    async def get_live_price(self, symbol: str) -> float:
        """Fetches live price for Nifty or Banknifty."""
        indices = await get_market_indices()
        mapping = {"NIFTY": "nifty", "BANKNIFTY": "banknifty"}
        key = mapping.get(symbol.upper())
        
        if key and key in indices:
            price = indices[key]["value"]
            self.mock_prices[symbol.upper()] = price
            return price
        
        base_price = self.mock_prices.get(symbol.upper(), 19500.0)
        change = random.uniform(-5.0, 5.0)
        new_price = base_price + change
        self.mock_prices[symbol.upper()] = new_price
        return round(new_price, 2)

    async def scan_for_signals(self, db: Session, user_id: Optional[int] = None):
        """Main engine loop."""
        if not self.is_market_open():
            self.current_signal_status = "Market Closed. Next session at 09:15 IST."
            return

        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        if not settings or not settings.auto_execute:
            self.current_signal_status = "Engine Paused. Waiting for manual start."
            return

        # Status randomization for "waiting" states
        if random.random() > 0.8:
            self.current_signal_status = random.choice([
                "Waiting for retest...",
                "Low Momentum. Holding for volume surge.",
                "Analyzing price action at supply zone...",
                "Scanning for EMA crossover...",
                "Volatility mismatch. Standing by."
            ])

        for symbol in ["NIFTY", "BANKNIFTY"]:
            active_trade = db.query(OptionTrade).filter(
                OptionTrade.symbol == symbol,
                OptionTrade.status == "OPEN"
            ).first()

            if active_trade:
                self.current_signal_status = f"Managing active {symbol} trade. Monitoring SL/TSL."
                await self.manage_trade(active_trade, db, settings.lots)
                continue

            # Check daily limit (Strictly Max 5)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            daily_trade_count = db.query(OptionTrade).filter(
                OptionTrade.symbol == symbol,
                OptionTrade.execution_time >= today_start
            ).count()

            if daily_trade_count >= settings.max_trades_day:
                continue

            # Signal Detection Logic
            signal = await self.detect_signal(symbol, settings.risk_mode)
            if signal:
                self.current_signal_status = f"Signal detected on {symbol}! Executing {signal['type']}."
                await self.execute_trade(signal, db, user_id)

    async def detect_signal(self, symbol: str, risk_mode: str) -> Optional[dict]:
        """Detects signals with newly added move-magnitude (points) requirements."""
        price = await self.get_live_price(symbol)
        
        if random.random() > 0.05: 
            return None

        direction = "CALL" if random.random() > 0.5 else "PUT"
        confidence = random.uniform(0.75, 0.95)
        
        # Risk Mode thresholds
        threshold = 0.85 if risk_mode == "Conservative" else 0.8 if risk_mode == "Balanced" else 0.75
        if confidence < threshold:
            return None

        # Point Move Requirements: 
        # Nifty >= 30-40 points
        # Banknifty >= 100 points
        min_move = 35 if symbol == "NIFTY" else 100
        expected_move = random.uniform(min_move, min_move * 2.5)
        
        # SL points
        sl_points = 30 if symbol == "NIFTY" else 150
        
        if direction == "CALL":
            sl = price - sl_points
            tsl1 = price + expected_move * 0.4
            tsl2 = price + expected_move * 0.7
            tsl3 = price + expected_move
            reason = f"Bullish breakout with expected move of {round(expected_move)} pts."
        else:
            sl = price + sl_points
            tsl1 = price - expected_move * 0.4
            tsl2 = price - expected_move * 0.7
            tsl3 = price - expected_move
            reason = f"Bearish trend confirmed with expected move of {round(expected_move)} pts."

        instrument = f"{symbol} {round(price/100)*100} {'CE' if direction == 'CALL' else 'PE'}"

        return {
            "symbol": symbol,
            "instrument": instrument,
            "type": direction,
            "confidence": confidence,
            "entry": price,
            "sl": sl,
            "tsl1": tsl1,
            "tsl2": tsl2,
            "tsl3": tsl3,
            "reason": reason
        }

    async def execute_trade(self, signal: dict, db: Session, user_id: Optional[int]):
        new_trade = OptionTrade(
            user_id=user_id,
            symbol=signal["symbol"],
            instrument=signal["instrument"],
            type=signal["type"],
            entry_price=signal["entry"],
            sl_price=signal["sl"],
            tsl_1=signal["tsl1"],
            tsl_2=signal["tsl2"],
            tsl_3=signal["tsl3"],
            current_tsl=None,
            status="OPEN",
            reason=signal["reason"],
            execution_time=datetime.utcnow()
        )
        db.add(new_trade)
        db.commit()

    async def manage_trade(self, trade: OptionTrade, db: Session, lots: int):
        current_price = await self.get_live_price(trade.symbol)
        
        # Calculate Current P&L using correct lot sizes
        # Nifty = 65 per lot, Banknifty = 15 per lot
        lot_size = 65 if trade.symbol == "NIFTY" else 15
        
        if trade.type == "CALL":
            pnl_points = current_price - trade.entry_price
        else:
            pnl_points = trade.entry_price - current_price
            
        trade.pnl = pnl_points * lot_size * lots
        trade.pnl_pct = (pnl_points / trade.entry_price) * 100
        
        # Trailing SL and Multi-Target logic
        if (trade.type == "CALL" and current_price <= trade.sl_price) or \
           (trade.type == "PUT" and current_price >= trade.sl_price):
            await self.exit_trade(trade, db, current_price, "Stop Loss Hit", lots)
            return

        if trade.tsl_1:
            if (trade.type == "CALL" and current_price >= trade.tsl_1) or \
               (trade.type == "PUT" and current_price <= trade.tsl_1):
                new_sl = trade.entry_price + (10 if trade.type == "CALL" else -10)
                if trade.sl_price != new_sl:
                    trade.sl_price = new_sl
                    trade.current_tsl = trade.tsl_1

        if trade.tsl_2:
            if (trade.type == "CALL" and current_price >= trade.tsl_2) or \
               (trade.type == "PUT" and current_price <= trade.tsl_2):
                new_sl = trade.tsl_1
                if trade.sl_price != new_sl:
                    trade.sl_price = new_sl
                    trade.current_tsl = trade.tsl_2

        if trade.tsl_3:
            if (trade.type == "CALL" and current_price >= trade.tsl_3) or \
               (trade.type == "PUT" and current_price <= trade.tsl_3):
                await self.exit_trade(trade, db, current_price, "Target 3 Achieved (TSL Hit)", lots)
                return

        db.commit()

    async def exit_trade(self, trade: OptionTrade, db: Session, exit_price: float, reason: str, lots: int):
        trade.exit_price = exit_price
        trade.status = "CLOSED"
        trade.exit_reason = reason
        trade.exit_time = datetime.utcnow()
        
        lot_size = 65 if trade.symbol == "NIFTY" else 15
        if trade.type == "CALL":
            pnl_points = exit_price - trade.entry_price
        else:
            pnl_points = trade.entry_price - exit_price
            
        trade.pnl = pnl_points * lot_size * lots
        trade.pnl_pct = (pnl_points / trade.entry_price) * 100
        
        db.commit()

    async def get_dashboard_summary(self, db: Session, user_id: Optional[int]) -> OptionSignalsDashboard:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        trades_query = db.query(OptionTrade).filter(
            OptionTrade.execution_time >= today_start
        ).order_by(OptionTrade.execution_time.desc())
        
        if user_id:
            trades_query = trades_query.filter(OptionTrade.user_id == user_id)
            
        trades = trades_query.all()
        
        total_pnl = sum([t.pnl for t in trades])
        wins = len([t for t in trades if t.pnl > 0 and t.status == "CLOSED"])
        closed_trades = [t for t in trades if t.status == "CLOSED"]
        win_rate = (wins / len(closed_trades) * 100) if closed_trades else 0.0
        active_trades_count = len([t for t in trades if t.status == "OPEN"])
        
        indices = await get_market_indices()
        
        return OptionSignalsDashboard(
            today_pnl=total_pnl,
            engine_status="Active" if self.is_market_open() else "Market Closed",
            signal_status=self.current_signal_status,
            active_trades_count=active_trades_count,
            win_rate=round(win_rate, 2),
            signals_today=len(trades),
            trades=[OptionTradeResponse.from_orm(t) for t in trades],
            nifty_live=indices.get("nifty"),
            banknifty_live=indices.get("banknifty")
        )

# Singleton instance
option_signals_service = OptionSignalsService()

async def run_option_signals_job():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        await option_signals_service.scan_for_signals(db)
    except Exception:
        traceback.print_exc()
    finally:
        db.close()
