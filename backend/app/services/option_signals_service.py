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
            "NIFTY": 24231.30,
            "BANKNIFTY": 52450.15
        }
        self.last_indices = {}
        self.current_signal_status = "Scanning for high-probability setups..."
        self.pending_pullbacks = {"NIFTY": None, "BANKNIFTY": None}

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
        """Main engine loop with global trade management."""
        if not self.is_market_open():
            self.current_signal_status = "Market Closed. Next session at 09:15 IST."
            return

        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        if not settings or not settings.auto_execute:
            self.current_signal_status = "Engine Paused. Waiting for manual start."
            return

        # 1. Manage ALL open trades
        open_trades = db.query(OptionTrade).filter(OptionTrade.status == "OPEN").all()
        for t in open_trades:
            await self.manage_trade(t, db, settings.lots)

        active_count = len(open_trades)
        
        # 2. Global Guard (Disabled Max 2, now 5 per system preference)
        if active_count >= 5:
            self.current_signal_status = f"System at Capacity ({active_count} Active Trades). Monitoring..."
            return

        # 3. Detect New Signals for both symbols
        for symbol in ["NIFTY", "BANKNIFTY"]:
            # Check daily limit from settings
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            daily_count = db.query(OptionTrade).filter(
                OptionTrade.symbol == symbol,
                OptionTrade.execution_time >= today_start
            ).count()

            if daily_count >= settings.max_trades_day:
                continue

            signal = await self.detect_signal(symbol, settings.risk_mode)
            if signal:
                self.current_signal_status = f"A+ Setup triggered on {symbol}! Executing {signal['type']}."
                await self.execute_trade(signal, db, user_id)

    def send_whatsapp_alert(self, msg: str, phone: str):
        """Sends WhatsApp alert via Twilio placeholder."""
        # Note: In production, use real Twilio credentials from settings
        # account_sid = "YOUR_SID"
        # auth_token = "YOUR_TOKEN"
        print(f"📲 [WhatsApp Alert Sim] To {phone}: {msg}")

    async def detect_signal(self, symbol: str, risk_mode: str) -> Optional[dict]:
        """
        Advanced Signal Engine: Institutional EMA Crossover + Pullback Engine.
        Incorporates Trend (EMA20/50), RSI, MACD, and Candle Strength.
        """
        from app.data.yahoo_fetcher import fetch_stock_data
        import pandas as pd
        import numpy as np

        ticker = "^NSEI" if symbol == "NIFTY" else "^NSEBANK"
        df = await asyncio.to_thread(fetch_stock_data, ticker, period="5d", interval="5m")
        
        if df is None or len(df) < 50:
            return None

        # 1. Indicator Stack (Institutional Grade)
        df['EMA9'] = df['Close'].ewm(span=9, adjust=False).mean()
        df['EMA21'] = df['Close'].ewm(span=21, adjust=False).mean()
        df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
        df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
        
        # RSI (14)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD (12, 26, 9)
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_SIGNAL'] = df['MACD'].ewm(span=9, adjust=False).mean()

        latest = df.iloc[-1]
        nifty_price = latest["Close"]
        ema9, ema21, ema20, ema50 = latest["EMA9"], latest["EMA21"], latest["EMA20"], latest["EMA50"]
        rsi, macd, macd_signal = latest["RSI"], latest["MACD"], latest["MACD_SIGNAL"]

        trend = "UPTREND" if ema20 > ema50 else "DOWNTREND"
        
        # ⚠️ WARNING FILTERS
        warnings = []
        momentum = abs(df["Close"].iloc[-1] - df["Close"].iloc[-5]) if len(df) >= 5 else 0
        if momentum < (25 if symbol == "NIFTY" else 75): warnings.append("Low Momentum")

        candle_body = abs(latest["Close"] - latest["Open"])
        candle_range = latest["High"] - latest["Low"]
        if candle_range == 0 or candle_body < (0.4 * candle_range): 
            warnings.append("Weak Candle")

        # --- 🚀 PULLBACK ENGINE ---
        pending = self.pending_pullbacks.get(symbol)
        if pending:
            pb_sig = pending["signal"]
            pb_price = pending["pullback_price"]
            br_price = pending["breakout_price"]
            
            is_triggered = False
            is_missed = False
            
            if pb_sig == "CALL":
                if nifty_price <= pb_price:
                    is_triggered = True
                elif nifty_price >= br_price + (25 if symbol == "NIFTY" else 75):
                    is_missed = True
            elif pb_sig == "PUT":
                if nifty_price >= pb_price:
                    is_triggered = True
                elif nifty_price <= br_price - (25 if symbol == "NIFTY" else 75):
                    is_missed = True
                    
            if is_missed:
                self.pending_pullbacks[symbol] = None
                self.current_signal_status = f"Pullback Missed on {symbol}. Resetting."
                return None
            elif not is_triggered:
                self.current_signal_status = f"Waiting for {pb_sig} Pullback to {round(pb_price,1)} on {symbol}"
                return None

            if is_triggered:
                # Setup Triggered -> Bypass filters and execute
                self.pending_pullbacks[symbol] = None
                direction = pb_sig
                reason = f"A+ PULLBACK ENTRY triggered at {round(nifty_price,1)}"
                entry_price = nifty_price
        else:
            # --- NEW SETUP DETECTION ---
            # 1. Early Setup (Indicator Strategy)
            indicator_signal = None
            if (nifty_price > ema9 and ema9 > ema21 and rsi > 60 and macd > macd_signal):
                indicator_signal = "CALL"
            elif (nifty_price < ema9 and ema9 < ema21 and rsi < 40 and macd < macd_signal):
                indicator_signal = "PUT"
            
            if not indicator_signal:
                self.current_signal_status = f"Scanning {symbol} for Trend Alignment..."
                return None

            # 2. Validation & Pullback Initialization
            if "Low Momentum" in warnings or "Weak Candle" in warnings:
                self.current_signal_status = f"Setup found on {symbol} but {warnings[0]}"
                return None
            
            # Entering Pullback State instead of direct entry
            pb_points = 10 if symbol == "NIFTY" else 30
            self.pending_pullbacks[symbol] = {
                "signal": indicator_signal,
                "breakout_price": nifty_price,
                "pullback_price": nifty_price - pb_points if indicator_signal == "CALL" else nifty_price + pb_points,
                "trend": trend
            }
            self.current_signal_status = f"A+ Setup on {symbol}. Waiting for Pullback to {round(self.pending_pullbacks[symbol]['pullback_price'],1)}"
            return None

        # ✅ QUALIFIED TRADE DATA (Only reached if Pullback is triggered)
        min_move = 50 if symbol == "NIFTY" else 150
        expected_move = min_move * (1.5 if risk_mode == "Aggressive" else 1.2)
        sl_points = 30 if symbol == "NIFTY" else 150
        
        if direction == "CALL":
            sl = entry_price - sl_points
            target = entry_price + expected_move
        else:
            sl = entry_price + sl_points
            target = entry_price - expected_move

        instrument = f"{symbol} {round(entry_price/100)*100} {'CE' if direction == 'CALL' else 'PE'}"

        return {
            "symbol": symbol, "instrument": instrument, "type": direction,
            "confidence": 0.95, "entry": entry_price, "sl": sl, "tsl1": entry_price + (target - entry_price) * 0.4,
            "tsl2": entry_price + (target - entry_price) * 0.7, "tsl3": target, "reason": reason
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

        # WhatsApp Notification if enabled
        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        if settings and settings.whatsapp_alerts and settings.phone_number:
            msg = f"🚀 {signal['symbol']} SIGNAL\n{signal['type']} @ {signal['entry']}\nTarget: {signal['tsl3']}\nSL: {signal['sl']}"
            self.send_whatsapp_alert(msg, settings.phone_number)

    async def manage_trade(self, trade: OptionTrade, db: Session, total_lots: int):
        current_price = await self.get_live_price(trade.symbol)
        lot_size = 65 if trade.symbol == "NIFTY" else 15
        
        # Calculate P&L using active multiplier (for partial profit scenarios)
        if trade.type == "CALL":
            pnl_points = current_price - trade.entry_price
        else:
            pnl_points = trade.entry_price - current_price
            
        current_unrealized = pnl_points * lot_size * (total_lots * trade.active_multiplier)
        trade.pnl = trade.realized_partial_pnl + current_unrealized
        trade.pnl_pct = (pnl_points / trade.entry_price) * 100
        
        # ✅ EXIT LOGIC (Partial Profit + Trailing SL)
        
        # 1. SL Hit
        if (trade.type == "CALL" and current_price <= (trade.trailing_sl or trade.sl_price)) or \
           (trade.type == "PUT" and current_price >= (trade.trailing_sl or trade.sl_price)):
            reason = "SL Hit" if not trade.partial_booked else "TSL Hit"
            await self.exit_trade(trade, db, current_price, reason, total_lots)
            return

        # 2. PARTIAL PROFIT (+30 pts for Nifty, +80 pts for Banknifty)
        partial_threshold = 30 if trade.symbol == "NIFTY" else 80
        if not trade.partial_booked and pnl_points >= partial_threshold:
            trade.partial_booked = True
            # Realize 50% of positions
            trade.realized_partial_pnl = round(partial_threshold * lot_size * (total_lots * 0.5), 2)
            trade.active_multiplier = 0.5 # Manage remaining 50%
            trade.sl_price = trade.entry_price # Move SL to Cost
            trade.trailing_sl = current_price - (20 if trade.type == "CALL" else -20)
            print(f"💰 [{trade.symbol}] Partial Profit Booked. SL moved to Cost. Multiplier: 0.5")

        # 3. Update Trailing SL if partial booked
        if trade.partial_booked:
            if trade.type == "CALL":
                new_tsl = max(trade.trailing_sl or trade.sl_price, current_price - 20)
                if new_tsl > trade.trailing_sl: trade.trailing_sl = new_tsl
            else:
                new_tsl = min(trade.trailing_sl or trade.sl_price, current_price + 20)
                if new_tsl < trade.trailing_sl: trade.trailing_sl = new_tsl

        # 4. Final Target Hit (TSL3)
        if (trade.type == "CALL" and current_price >= trade.tsl_3) or \
           (trade.type == "PUT" and current_price <= trade.tsl_3):
            await self.exit_trade(trade, db, current_price, "Final Target Hit", total_lots)
            return

        db.commit()

    async def exit_trade(self, trade: OptionTrade, db: Session, exit_price: float, reason: str, total_lots: int):
        trade.exit_price = exit_price
        trade.status = "CLOSED"
        trade.exit_reason = reason
        trade.exit_time = datetime.utcnow()
        
        lot_size = 65 if trade.symbol == "NIFTY" else 15
        if trade.type == "CALL":
            pnl_points = exit_price - trade.entry_price
        else:
            pnl_points = trade.entry_price - exit_price
            
        # P&L for closed portion or whole position
        final_pnl = trade.realized_partial_pnl + (pnl_points * lot_size * (total_lots * trade.active_multiplier))
        trade.pnl = round(final_pnl, 2)
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
        from app.models.user import User
        # Run for all active signal subscribers (simplified for now as one system job)
        await option_signals_service.scan_for_signals(db)
    except Exception:
        traceback.print_exc()
    finally:
        db.close()
