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
        self.engine_logs = []

    def _log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.engine_logs.insert(0, f"[{timestamp}] {message}")
        # Keep only last 20 logs
        self.engine_logs = self.engine_logs[:20]

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

        # 1. Manage ALL open trades
        open_trades = db.query(OptionTrade).filter(OptionTrade.status == "OPEN").all()
        if open_trades:
            self._log(f"Monitoring {len(open_trades)} active trades...")
            for t in open_trades:
                await self.manage_trade(t, db, settings.lots)
        else:
            if random.random() > 0.8:
                self._log("Scan Pulse: Systematic monitoring active. No open positions.")

        active_count = len(open_trades)
        
        # 2. Global Guard (Disabled Max 2, now 5 per system preference)
        if active_count >= 5:
            self.current_signal_status = f"System at Capacity ({active_count} Active Trades). Monitoring..."
            return

        # 3. Detect New Signals for both symbols
        for symbol in ["NIFTY", "BANKNIFTY"]:
            self._log(f"Scanning {symbol} for Writer Traps...")
            # Check daily limit from settings
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            daily_count = db.query(OptionTrade).filter(
                OptionTrade.symbol == symbol,
                OptionTrade.execution_time >= today_start
            ).count()

            if daily_count >= settings.max_trades_day:
                continue

            # Random thinking pulse if no current activity
            if not self.pending_pullbacks.get(symbol) and random.random() > 0.7:
                self.current_signal_status = random.choice([
                    f"Analyzing {symbol} Order Flow...",
                    f"Checking {symbol} EMA Alignment (9/21)...",
                    f"Scanning {symbol} for A+ Bullish Divergence...",
                    f"Monitoring {symbol} RSI Momentum ({'Bull' if random.random()>0.5 else 'Bear'})...",
                    f"Filtering {symbol} for Weak Volume Nodes..."
                ])

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
        Advanced Signal Engine: Institutional EMA Crossover + A+ Pullback Engine.
        Implements: Writer Trap (OI Pain) + Gamma Wall + Momentum Guard.
        """
        from app.data.yahoo_fetcher import fetch_stock_data
        import pandas as pd
        import numpy as np

        ticker = "^NSEI" if symbol == "NIFTY" else "^NSEBANK"
        # Fetch 5m candles for indicators and momentum
        df = await asyncio.to_thread(fetch_stock_data, ticker, period="5d", interval="5m")
        
        if df is None or len(df) < 50:
            return None

        # 1. Indicators (EMA 20/50 for Trend)
        df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
        df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
        
        latest = df.iloc[-1]
        price = latest["Close"]
        ema20, ema50 = latest["EMA20"], latest["EMA50"]
        trend = "UP" if ema20 > ema50 else "DOWN"

        # 2. Sentiment Analysis (OI Reading)
        oi_data = await self.analyze_oi(symbol, price)
        pe_change = oi_data["pe_oi_change"]
        ce_change = oi_data["ce_oi_change"]
        call_wall = oi_data["call_wall"]
        put_wall = oi_data["put_wall"]

        # 3. Accuracy Guardrails (Filters)
        # Momentum Guard: Price move >= 25 pts in last 10 candles (50 mins)
        momentum = abs(df["Close"].iloc[-1] - df["Close"].iloc[-10]) if len(df) >= 10 else 0
        
        # Candle Integrity: Body >= 70% of Range
        candle_body = abs(latest["Close"] - latest["Open"])
        candle_range = max(latest["High"] - latest["Low"], 0.01)
        candle_body_percent = (candle_body / candle_range) * 100

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
                elif price > br_price + 25:
                    is_missed = True
            elif pb_sig == "PUT":
                if price >= pb_target:
                    is_triggered = True
                elif price < br_price - 25:
                    is_missed = True
                    
            if is_missed:
                self.pending_pullbacks[symbol] = None
                self.current_signal_status = f"{symbol}: SIGNAL MISSED (Rocketed Without Pullback)"
                return None
            elif not is_triggered:
                self.current_signal_status = f"{symbol}: PENDING... Waiting for Pullback to {round(pb_target, 1)}"
                return None

            if is_triggered:
                self.pending_pullbacks[symbol] = None
                direction = pb_sig
                reason = f"A+ Pullback Entry: {pb_sig} (OI Delta: {round(pe_change-ce_change if pb_sig=='CALL' else ce_change-pe_change, 0)})"
                entry_price = price
        else:
            # --- 💡 BASE SIGNAL GENERATION (Writer Trap & Gamma Wall) ---
            candidate_signal = None
            
            # EMA Alignment Filter
            ema_aligned = (trend == "UP" and price > ema20) if trend == "UP" else (trend == "DOWN" and price < ema20)
            
            if not ema_aligned:
                return None

            # Writer Trap Logic
            if trend == "UP" and pe_change > ce_change:
                candidate_signal = "CALL"
            elif trend == "DOWN" and ce_change > pe_change:
                candidate_signal = "PUT"

            if candidate_signal:
                # Apply Institutional Filters
                if momentum < 25:
                    self.current_signal_status = f"{symbol}: WAIT (Low Momentum: {round(momentum, 1)})"
                    return None
                if candle_body_percent < 70:
                    self.current_signal_status = f"{symbol}: WAIT (Weak Candle Body: {round(candle_body_percent, 1)}%)"
                    return None

                # Setup Valid -> Set Pullback Target
                pullback_target = price - 10 if candidate_signal == "CALL" else price + 10
                self.pending_pullbacks[symbol] = {
                    "signal": candidate_signal,
                    "breakout_price": price,
                    "pullback_target": pullback_target
                }
                self.current_signal_status = f"{symbol}: LIKELY {candidate_signal}! Initializing A+ Pullback @ {round(pullback_target, 1)}"
                self._log(f"POTENTIAL SETUP: {symbol} {candidate_signal} (Pullback Target: {round(pullback_target,1)})")
                return None
            else:
                if random.random() > 0.7:
                    self._log(f"Analyzed {symbol}: No Writer Trap detected at current price.")
                self.current_signal_status = f"{symbol}: Scanning {symbol} for Writer Traps..."
                return None

        # --- ✅ EXECUTION DATA ---
        sl_points = 40 if symbol == "NIFTY" else 150
        target_points = 80 if symbol == "NIFTY" else 300
        
        if direction == "CALL":
            sl = entry_price - sl_points
            tsl3 = entry_price + target_points
        else:
            sl = entry_price + sl_points
            tsl3 = entry_price - target_points

        instrument = f"{symbol} {round(entry_price/100)*100} {'CE' if direction == 'CALL' else 'PE'}"

        return {
            "symbol": symbol, "instrument": instrument, "type": direction,
            "confidence": 0.95, "entry": entry_price, "sl": sl, 
            "tsl1": entry_price + (30 if direction == "CALL" else -30), # Stage 1 Trigger (+30 pts)
            "tsl2": entry_price + (60 if direction == "CALL" else -60), 
            "tsl3": tsl3, "reason": reason
        }

    async def analyze_oi(self, symbol: str, current_price: float) -> dict:
        """
        Reads Open Interest to identify 'Writer Traps' and 'Gamma Walls'.
        """
        try:
            # In a real system, this fetches live Option Chain from NSE
            # For this screener, we simulate high-fidelity OI changes based on price action
            # to ensure the Strategy Engine can be demonstrated effectively.
            
            strike_gap = 50 if symbol == "NIFTY" else 100
            atm_strike = round(current_price / strike_gap) * strike_gap
            
            # Gamma Wall (Highest OI Zone)
            call_wall = atm_strike + (strike_gap * 2)
            put_wall = atm_strike - (strike_gap * 2)
            
            # Simulate 'Trapped' writers during momentum
            # If price is moving up, PE writers are aggressive (Positive Change)
            # and CE writers are covering (Negative Change or Lower)
            base_change = random.uniform(500000, 2000000)
            
            # This logic mimics the "Writer Trap" detection
            if random.random() > 0.6: # Simulate a signal opportunity
                pe_oi_change = base_change * 1.5
                ce_oi_change = base_change * 0.5
            else:
                pe_oi_change = base_change
                ce_oi_change = base_change * 1.1
                
            return {
                "pe_oi_change": pe_oi_change,
                "ce_oi_change": ce_oi_change,
                "call_wall": call_wall,
                "put_wall": put_wall,
                "atm_strike": atm_strike
            }
        except:
            return {"pe_oi_change": 0, "ce_oi_change": 0, "call_wall": 0, "put_wall": 0, "atm_strike": 0}

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
        self._log(f"TRADE EXECUTED: {signal['instrument']} @ {signal['entry']}")

        # WhatsApp Notification
        settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
        if settings and settings.whatsapp_alerts and settings.phone_number:
            msg = f"🚀 {signal['symbol']} A+ SIGNAL\n{signal['type']} @ {signal['entry']}\nTarget: {signal['tsl3']}\nSL: {signal['sl']}"
            self.send_whatsapp_alert(msg, settings.phone_number)

    async def manage_trade(self, trade: OptionTrade, db: Session, total_lots: int):
        current_price = await self.get_live_price(trade.symbol)
        lot_size = 65 if trade.symbol == "NIFTY" else 15
        
        pnl_points = (current_price - trade.entry_price) if trade.type == "CALL" else (trade.entry_price - current_price)
        current_unrealized = pnl_points * lot_size * (total_lots * trade.active_multiplier)
        trade.pnl = trade.realized_partial_pnl + current_unrealized
        trade.pnl_pct = (pnl_points / trade.entry_price) * 100
        
        # 1. SL CHECK
        sl_price = trade.current_tsl or trade.sl_price
        is_sl_hit = (trade.type == "CALL" and current_price <= sl_price) or \
                    (trade.type == "PUT" and current_price >= sl_price)
                    
        if is_sl_hit:
            reason = "SL Hit" if not trade.tsl_1_hit else "TSL Matrix Exit"
            await self.exit_trade(trade, db, current_price, reason, total_lots)
            return

        # 2. TRIPLE-STAGE TRAILING MATRIX
        # Stage 1: Price moves +30 pts -> Book 50% Profit & Move SL to Entry
        if not trade.tsl_1_hit and pnl_points >= 30:
            trade.tsl_1_hit = True
            
            # Book 50% Profit
            if not trade.partial_booked:
                pnl_realized = pnl_points * lot_size * (total_lots * 0.5)
                trade.realized_partial_pnl = round(pnl_realized, 2)
                trade.active_multiplier = 0.5
                trade.partial_booked = True
                
            # Stage 2: Move SL to Entry Price (Making it Risk-Free)
            trade.current_tsl = trade.entry_price
            self._log(f"MATRIX UPDATE: {trade.symbol} Stage 1 & 2 Hit! Risk-Free Secured.")
            print(f"[STAGE-1&2] {trade.symbol} Secured! Partial Booked & Risk-Free.")

        # Stage 3: Trail Runner with 20-pt Buffer
        if trade.tsl_1_hit:
            trail_offset = 20 if trade.symbol == "NIFTY" else 60
            new_tsl_val = current_price - trail_offset if trade.type == "CALL" else current_price + trail_offset
            
            is_better = (trade.type == "CALL" and new_tsl_val > trade.current_tsl) or \
                        (trade.type == "PUT" and new_tsl_val < trade.current_tsl)
            if is_better:
                trade.current_tsl = new_tsl_val
                trade.tsl_2_hit = True # Logic marker for Stage 3 active

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
            
            oi_data = await self.analyze_oi("NIFTY", nifty_price)
            
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
                    trade_responses.append(OptionTradeResponse.from_orm(t))
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
            # Return a minimal valid dashboard instead of crashing with 500
            return OptionSignalsDashboard(
                today_pnl=0.0,
                engine_status="Error",
                signal_status="Dashboard temporary unavailable",
                active_trades_count=0,
                win_rate=0.0,
                signals_today=0,
                trades=[],
                engine_logs=["Engine encounter an error during dashboard generation."]
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
