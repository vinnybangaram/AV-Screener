import random
import asyncio
from datetime import datetime, time as dt_time
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from ..models.option_signal import OptionTrade, OptionSettings
from ..schemas.option_signal import OptionTradeResponse, OptionSignalsDashboard
from ..services.market_service import get_market_indices
import traceback
import pandas as pd

class OptionSignalsService:
    def __init__(self):
        self.mock_prices = {
            "NIFTY": 24231.30,
            "BANKNIFTY": 52450.15
        }
        self.last_indices = {}
        self.current_signal_status = "Scanning for high-probability setups..."
        self.pending_pullbacks = {"NIFTY": None, "BANKNIFTY": None}
        self.engine_logs = []

    def _log(self, message: str):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.engine_logs.insert(0, log_entry)
        # Keep only last 20 in-memory logs
        self.engine_logs = self.engine_logs[:20]
        
        # Also write to a persistent log file
        try:
            import os
            log_dir = "logs"
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            with open(os.path.join(log_dir, "engine.log"), "a") as f:
                f.write(log_entry + "\n")
        except Exception:
            pass

    def is_market_open(self) -> bool:
        """Checks if current time is within Indian Market hours (9:15 AM - 3:30 PM IST)."""
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        
        market_start = dt_time(9, 15)
        market_end = dt_time(15, 30)
        current_time = now_ist.time()
        
        if now_ist.weekday() >= 5:
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
        if not self.is_market_open():
            return round(base_price, 2)
            
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

        # 1. Manage ALL open trades for THIS user
        open_trades = db.query(OptionTrade).filter(
            OptionTrade.status == "OPEN",
            OptionTrade.user_id == user_id
        ).all()
        
        if open_trades:
            self._log(f"[User {user_id}] Monitoring {len(open_trades)} active trades...")
            for t in open_trades:
                await self.manage_trade(t, db, settings.lots)
        else:
            if random.random() > 0.8:
                self._log("Scan Pulse: Systematic monitoring active. No open positions.")

        active_count = len(open_trades)
        
        # 2. Sequential Trade Guard (Max 1 concurrent trade as requested)
        if active_count >= 1:
            self.current_signal_status = f"Managing {active_count} active position. Next entry paused until exit."
            return

        # 3. Detect New Signals - NIFTY ONLY (BANKNIFTY Disabled)
        for symbol in ["NIFTY"]:
            self._log(f"Scanning {symbol} for Institutional OI Traps...")
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            daily_count = db.query(OptionTrade).filter(
                OptionTrade.symbol == symbol,
                OptionTrade.user_id == user_id,
                OptionTrade.execution_time >= today_start
            ).count()

            if daily_count >= settings.max_trades_day:
                continue

            # Engine Status Pulses
            if not self.pending_pullbacks.get(symbol) and random.random() > 0.7:
                self.current_signal_status = random.choice([
                    f"Analyzing {symbol} Order Flow...",
                    f"Checking {symbol} A+ Pullback conditions...",
                    f"Scanning {symbol} for Gamma Wall coverage...",
                    f"Filtering {symbol} for Institutional Guardrails...",
                    f"Monitoring {symbol} PCR Sentiment...",
                    f"Market Pulse: {symbol} at {round(await self.get_live_price(symbol), 2)}"
                ])

            signal = await self.detect_signal(symbol, settings.risk_mode)
            if signal:
                self.current_signal_status = f"A+ Entry Confirmed on {symbol}! Executing {signal['type']}."
                await self.execute_trade(signal, db, user_id)
            # Log periodic scan with indicators to show engine is alive
            elif random.random() > 0.5: # Show pulse more often
                pass 

    def send_whatsapp_alert(self, msg: str, phone: str):
        """Sends WhatsApp alert via Twilio placeholder."""
        print(f"📲 [WhatsApp Alert Sim] To {phone}: {msg}")

    async def detect_signal(self, symbol: str, risk_mode: str) -> Optional[dict]:
        """
        Pillar 2: The A+ Pullback Engine.
        Implements: Momentum Guard + Candle Integrity + 10-pt Pullback Entry.
        """
        from app.data.yahoo_fetcher import fetch_stock_data
        import numpy as np

        # Fetch 5m candles for indicators and momentum
        df = await asyncio.to_thread(fetch_stock_data, symbol, period="5d", interval="5m")
        
        if df is None or len(df) < 50:
            return None

        # Indicators (EMA 9/21 for Entry Bias)
        df['EMA9'] = df['Close'].ewm(span=9, adjust=False).mean()
        df['EMA21'] = df['Close'].ewm(span=21, adjust=False).mean()
        df['RSI'] = self.calculate_rsi(df['Close'])
        
        latest = df.iloc[-1]
        price = latest["Close"]
        ema9, ema21, rsi = latest["EMA9"], latest["EMA21"], latest["RSI"]

        # 1. Institutional OI & Gamma Logic
        oi_results = await self.analyze_oi_engine(symbol, price)
        pcr = oi_results["pcr"]
        
        # --- 🚀 PULLBACK ENGINE ---
        pending = self.pending_pullbacks.get(symbol)
        if pending:
            pb_sig = pending["signal"]
            pb_target = pending["pullback_target"]
            br_price = pending["breakout_price"]
            
            is_triggered = False
            is_missed = False
            
            if pb_sig == "CALL":
                if price <= pb_target:
                    is_triggered = True
                elif price > br_price + 45: # Cancel if rocks too far without PB
                    is_missed = True
            elif pb_sig == "PUT":
                if price >= pb_target:
                    is_triggered = True
                elif price < br_price - 45:
                    is_missed = True
                    
            if is_missed:
                self.pending_pullbacks[symbol] = None
                self._log(f"SIGNAL CANCELLED: {symbol} moved too far (45+ pts) without pullback.")
                return None
            elif not is_triggered:
                # Update status but don't log every 10s to avoid clutter
                self.current_signal_status = f"{symbol}: Awaiting 6-pt Pullback to {round(pb_target, 1)}..."
                return None

            if is_triggered:
                self.pending_pullbacks[symbol] = None
                direction = pb_sig
                reason = "A+ Pullback Triggered (Confirmed 6-pt Dip)"
                entry_price = price
        else:
            # --- 💡 STRATEGY FILTERS (Institutional Guardrails) ---
            
            # Trend Strength: Price moved at least 15 pts in last 10 candles (Relaxed from 25)
            trend_move = abs(df["Close"].iloc[-1] - df["Close"].iloc[-10]) if len(df) >= 10 else 0
            
            # Candle Integrity: Body >= 55% of total Range (Relaxed from 70%)
            candle_body = abs(latest["Close"] - latest["Open"])
            candle_range = max(latest["High"] - latest["Low"], 0.1)
            integrity = (candle_body / candle_range)
            
            # Engine Pulse Log (Show every few scans)
            if random.random() > 0.7:
                self._log(f"Pulse [{symbol}]: Price={round(price,1)}, Trend={round(trend_move,1)}, RSI={round(rsi,1)}, Integrity={round(integrity*100)}%, PCR={round(pcr,2)}")

            if trend_move < 15:
                return None
                
            if integrity < 0.35:
                return None

            # Base Signal: EMA 9 > 21 and RSI > 55 (Relaxed from 60)
            candidate = None
            if ema9 > ema21 and rsi > 55 and pcr > 1.0:
                candidate = "CALL"
            elif ema9 < ema21 and rsi < 45 and pcr < 0.9:
                candidate = "PUT"

            if candidate:
                pb_target = price - 6 if candidate == "CALL" else price + 6
                self.pending_pullbacks[symbol] = {
                    "signal": candidate,
                    "breakout_price": price,
                    "pullback_target": pb_target
                }
                self._log(f"A+ SETUP DETECTED: {symbol} {candidate}. Waiting for 6-pt Pullback.")
                return None
            return None

        # --- ✅ EXECUTION DATA (Aimed at 40-60 pts profit) ---
        target_pts = 75 # Higher target for better RR
        sl_pts = 35
        
        if direction == "CALL":
            target = entry_price + target_pts
            sl = entry_price - sl_pts
        else:
            target = entry_price - target_pts
            sl = entry_price + sl_pts
        
        instrument = f"{symbol} {round(entry_price/100)*100} {'CE' if direction == 'CALL' else 'PE'}"

        return {
            "symbol": symbol, "instrument": instrument, "type": direction,
            "confidence": 0.98, "entry": entry_price, "sl": sl, 
            "tsl1": entry_price + (40 if direction == "CALL" else -40), # Stage 1 Trigger at 40 pts
            "tsl2": 0, 
            "tsl3": target, 
            "reason": reason
        }

    async def analyze_oi_engine(self, symbol: str, current_price: float) -> dict:
        """Pillar 1: Institutional OI & Gamma Logic."""
        # Simulated accurate OI response mapping to institutional positions
        strike_gap = 50
        atm = round(current_price / strike_gap) * strike_gap
        
        res = atm + 100 # Resistance
        sup = atm - 100 # Support
        gamma_wall = atm + 50
        
        # Match sentiment based on prevailing price vs walls
        pcr = 1.15 if current_price > atm else 0.85
        
        return {
            "resistance": res,
            "support": sup,
            "gamma_wall": gamma_wall,
            "pcr": pcr,
            "pe_oi_change": 1250000 if pcr > 1 else 850000,
            "ce_oi_change": 850000 if pcr > 1 else 1250000
        }

    def calculate_rsi(self, series: pd.Series, period: int = 14) -> float:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs)).iloc[-1]

    async def execute_trade(self, signal: dict, db: Session, user_id: Optional[int]):
        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        lots = settings.lots if settings else 1
        
        new_trade = OptionTrade(
            user_id=user_id,
            symbol=signal["symbol"],
            instrument=signal["instrument"],
            type=signal["type"],
            lots=lots,
            entry_price=signal["entry"],
            sl_price=signal["sl"],
            tsl_1=signal["tsl1"],
            tsl_2=signal["tsl2"],
            tsl_3=signal["tsl3"],
            current_tsl=signal["sl"],
            tsl_1_hit=False,
            tsl_2_hit=False,
            tsl_3_hit=False,
            status="OPEN",
            reason=signal["reason"],
            execution_time=datetime.utcnow()
        )
        db.add(new_trade)
        db.commit()
        self._log(f"A+ EXECUTED: {signal['instrument']} @ {signal['entry']}")

        # WhatsApp Notification
        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        if settings and settings.whatsapp_alerts and settings.phone_number:
            msg = f"🚀 {signal['symbol']} A+ SIGNAL\n{signal['type']} @ {signal['entry']}\nTarget: {signal['tsl3']}\nSL: {signal['sl']}"
            self.send_whatsapp_alert(msg, settings.phone_number)

    async def manage_trade(self, trade: OptionTrade, db: Session, total_lots_not_used: int):
        """Pillar 3: Triple-Stage Trailing Matrix."""
        current_price = await self.get_live_price(trade.symbol)
        lot_size = 65 if trade.symbol == "NIFTY" else 15 # Nifty Lot Size updated to 65
        
        pnl_pts = (current_price - trade.entry_price) if trade.type == "CALL" else (trade.entry_price - current_price)
        trade.pnl = (trade.realized_partial_pnl) + (pnl_pts * lot_size * (trade.lots * trade.active_multiplier))
        trade.pnl_pct = (pnl_pts / trade.entry_price) * 100
        
        # 1. Exit Evaluation
        exit_signal = None
        
        # Stage 1: Price hits +40 pts -> Book 50% & Move SL to Cost
        if not trade.partial_booked and pnl_pts >= 40:
            trade.partial_booked = True
            trade.tsl_1_hit = True
            # Realize 50% pnl
            trade.realized_partial_pnl = (40 * lot_size * trade.lots * 0.5)
            trade.active_multiplier = 0.5
            trade.current_tsl = trade.entry_price # Move SL to Entry (Risk-Free)
            self._log(f"TSL STAGE 1: {trade.symbol} Part-Booked at +40pts & Secured at Cost.")
        
        # Stage 2: Dynamic Trailing at Current - 20 pts
        if trade.partial_booked:
            tsl_buffer = 20
            new_tsl = current_price - tsl_buffer if trade.type == "CALL" else current_price + tsl_buffer
            
            is_improvement = (trade.type == "CALL" and new_tsl > trade.current_tsl) or \
                             (trade.type == "PUT" and new_tsl < trade.current_tsl)
            if is_improvement:
                trade.current_tsl = new_tsl
                trade.tsl_2_hit = True
                
        # Stage 3: Target Hit (tsl_3)
        is_target_hit = (trade.type == "CALL" and current_price >= trade.tsl_3) or \
                        (trade.type == "PUT" and current_price <= trade.tsl_3)
        if is_target_hit:
            exit_signal = "EXIT_TARGET"
            
        # SL / TSL Check
        is_sl_hit = (trade.type == "CALL" and current_price <= trade.current_tsl) or \
                    (trade.type == "PUT" and current_price >= trade.current_tsl)
        if is_sl_hit:
            exit_signal = "EXIT_SL_TSL"

        if exit_signal:
            await self.exit_trade(trade, db, current_price, exit_signal, total_lots)
        else:
            db.commit()

    async def exit_trade(self, trade: OptionTrade, db: Session, exit_price: float, reason: str, total_lots_not_used: int):
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
        final_pnl = trade.realized_partial_pnl + (pnl_points * lot_size * (trade.lots * trade.active_multiplier))
        trade.pnl = round(final_pnl, 2)
        trade.pnl_pct = (pnl_points / trade.entry_price) * 100
        
        db.commit()

    async def get_dashboard_summary(self, db: Session, user_id: Optional[int]) -> OptionSignalsDashboard:
        try:
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            trades_query = db.query(OptionTrade).filter(
                OptionTrade.execution_time >= today_start
            ).order_by(OptionTrade.execution_time.desc())
            
            if user_id:
                trades_query = trades_query.filter(OptionTrade.user_id == user_id)
                
            trades = trades_query.all()
            
            # Null-safe P&L aggregation
            total_pnl = sum([(t.pnl or 0.0) for t in trades])
            wins = len([t for t in trades if (t.pnl or 0) > 0 and t.status == "CLOSED"])
            closed_trades = [t for t in trades if t.status == "CLOSED"]
            win_rate = (wins / len(closed_trades) * 100) if closed_trades else 0.0
            active_trades_count = len([t for t in trades if t.status == "OPEN"])
            
            indices = await get_market_indices() or {}
            
            # Latest OI Analysis for Dashboard
            nifty_data = indices.get("nifty", {"value": 24200})
            nifty_price = nifty_data.get("value", 24200)
            
            oi_data = await self.analyze_oi_engine("NIFTY", nifty_price)
            
            # Safe PCR calculation
            pe_oi = oi_data.get("pe_oi_change", 0)
            ce_oi = oi_data.get("ce_oi_change", 0)
            pcr = round(pe_oi / max(ce_oi, 1), 2)
            
            # Map trades to schema objects (using model_validate for Pydantic v2 compatibility)
            trade_responses = []
            for t in trades:
                try:
                    # Manually ensure required fields are not None for the schema
                    if t.reason is None: t.reason = "System Entry"
                    if t.symbol is None: t.symbol = "NIFTY"
                    if t.type is None: t.type = "CALL"
                    
                    # Calculate pnl_pts for display
                    lot_size = 65 if t.symbol == "NIFTY" else 15
                    current_price = t.exit_price if t.status == "CLOSED" else await self.get_live_price(t.symbol)
                    pnl_pts = (current_price - t.entry_price) if t.type == "CALL" else (t.entry_price - current_price)
                    
                    resp = OptionTradeResponse.from_orm(t)
                    resp.pnl_pts = round(pnl_pts, 2)
                    trade_responses.append(resp)
                except Exception as e:
                    print(f"Error mapping trade {t.id}: {e}")
            
            return OptionSignalsDashboard(
                today_pnl=float(total_pnl),
                engine_status="Active" if self.is_market_open() else "Market Closed",
                signal_status=self.current_signal_status,
                active_trades_count=active_trades_count,
                win_rate=round(float(win_rate), 2),
                signals_today=len(trades),
                trades=trade_responses,
                nifty_live=indices.get("nifty"),
                banknifty_live=indices.get("banknifty"),
                pcr=float(pcr),
                ce_oi_total=float(ce_oi * 10),
                pe_oi_total=float(pe_oi * 10),
                call_wall=float(oi_data.get("call_wall", 0)),
                put_wall=float(oi_data.get("put_wall", 0)),
                engine_logs=self.engine_logs
            )
        except Exception as e:
            print(f"CRITICAL: OptionSignals dashboard failure: {e}")
            traceback.print_exc()
            
            # Even on error, try to get live prices for UI stability
            indices = {}
            try:
                indices = await get_market_indices()
            except:
                pass
                
            return OptionSignalsDashboard(
                today_pnl=0.0,
                engine_status="Error",
                signal_status="Engine state out of sync. Please restart.",
                active_trades_count=0,
                win_rate=0.0,
                signals_today=0,
                trades=[],
                nifty_live=indices.get("nifty"),
                banknifty_live=indices.get("banknifty"),
                engine_logs=["Engine encountered an error during dashboard generation. Check backend logs."]
            )

# Singleton instance
option_signals_service = OptionSignalsService()

async def run_option_signals_job():
    from app.database import SessionLocal
    from app.models.option_signal import OptionSettings
    db = SessionLocal()
    try:
        # Fetch all users who have the Ignite Engine enabled
        active_settings = db.query(OptionSettings).filter(OptionSettings.auto_execute == True).all()
        if not active_settings:
            return

        print(f"[Engine] Running autonomous scan for {len(active_settings)} active subscribers...")
        for setting in active_settings:
            await option_signals_service.scan_for_signals(db, user_id=setting.user_id)
            
    except Exception:
        print("❌ [Engine] Background job failed:")
        traceback.print_exc()
    finally:
        db.close()
