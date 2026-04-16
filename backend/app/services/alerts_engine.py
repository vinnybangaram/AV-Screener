from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.watchlist import WatchlistPosition
from app.services.stock_analysis_service import get_full_analysis
from app.services.confluence_engine import engine as confluence_engine
from app.services.trade_setup_engine import engine as setup_engine
from datetime import datetime
import time

class AlertsEngine:
    """
    Intelligent monitoring engine that scans user assets and generates context-aware alerts.
    """

    def process_user_alerts(self, db: Session, user_id: int):
        # 1. Fetch user's active watchlist
        watchlist_items = db.query(WatchlistPosition).filter(
            WatchlistPosition.user_id == user_id, 
            WatchlistPosition.is_active == True
        ).all()
        
        for item in watchlist_items:
            try:
                # Get real-time analysis
                analysis = get_full_analysis(item.symbol)
                if not analysis: continue
                
                cmp = analysis['price']
                
                # Check for Price Triggers (Target/SL)
                if item.target_price and cmp >= item.target_price:
                    self._create_alert(db, user_id, item.symbol, "TARGET_HIT", "High", 
                                     "Target Achieved", f"{item.symbol} crossed your target of ₹{item.target_price}")
                
                elif item.stop_loss and cmp <= item.stop_loss:
                    self._create_alert(db, user_id, item.symbol, "SL_HIT", "Critical", 
                                     "Stop Loss Triggered", f"{item.symbol} dropped below ₹{item.stop_loss} support")

                # Check for Signal Changes (Setup/Confluence)
                # We check every ~30 min for these to avoid spamming
                conf_data = confluence_engine.generate_score(item.symbol)
                setup_data = setup_engine.generate_setup(item.symbol)
                
                if setup_data['status'] == "Valid" and setup_data['confidence'] == "High":
                    # Only alert if new valid setup
                    self._create_alert(db, user_id, item.symbol, "SETUP_ACTIVATED", "High",
                                     "Setup Activated", f"High-conviction {setup_data['setupType']} identified for {item.symbol}")

                if conf_data['score'] < 30:
                    self._create_alert(db, user_id, item.symbol, "TREND_WEAKENING", "Medium",
                                     "Trend Breakdown", f"Structural signal strength for {item.symbol} has dropped significantly.")

                db.commit()
            except Exception as e:
                print(f"[Alerts] Error processing {item.symbol}: {e}")
                db.rollback()

    def _create_alert(self, db: Session, user_id: int, symbol: str, alert_type: str, priority: str, title: str, message: str):
        # Anti-spam: check if similar unread alert exists for this symbol in last 6 hours
        existing = db.query(Alert).filter(
            Alert.user_id == user_id,
            Alert.symbol == symbol,
            Alert.type == alert_type,
            Alert.is_read == False
        ).order_by(Alert.created_at.desc()).first()

        if existing:
            # Check if it was created recently
            time_diff = datetime.utcnow() - existing.created_at
            if time_diff.total_seconds() < 21600: # 6 hours cooldown
                return

        new_alert = Alert(
            user_id=user_id,
            symbol=symbol,
            type=alert_type,
            priority=priority,
            title=title,
            message=message,
            action="Review Chart"
        )
        db.add(new_alert)
        db.commit()

engine = AlertsEngine()
