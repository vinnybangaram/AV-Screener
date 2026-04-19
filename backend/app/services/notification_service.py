import resend
import logging
from app.utils.config import settings
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from typing import List

# Set up logging
logger = logging.getLogger("uvicorn.error")

def send_email_notification(to_email: str, subject: str, content: str):
    """Sends email alert via Resend."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY missing - skipping email")
        return
        
    logger.info(f"📧 [Email] Attempting to send email to {to_email} via Resend...")
    try:
        resend.api_key = settings.RESEND_API_KEY
        r = resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": to_email,
            "subject": subject,
            "html": content
        })
        email_id = r.get('id') if r else 'Unknown'
        logger.info(f"✅ [Email] Success! ID: {email_id}")
        return r
    except Exception as e:
        logger.error(f"❌ [Email] Resend Error: {str(e)}")
        # Print for terminal visibility too
        print(f"RESEND ERROR: {e}")

def trigger_notification(db: Session, user_id: int, symbol: str, message: str, type: str, priority: str = "LOW"):
    """Creates in-app notification and sends email."""
    # 1. Create DB entry
    db_notif = Notification(
        user_id=user_id,
        symbol=symbol,
        message=message,
        type=type,
        priority=priority
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    
    # 2. Get user info for email
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.email:
        subject = f"AV-Screener Alert: {type} for {symbol}"
        send_email_notification(user.email, subject, f"<h3>Alert for {symbol}</h3><p>{message}</p>")
    
    return db_notif

def get_user_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

def mark_notification_read(db: Session, user_id: int, notification_id: int):
    db_notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if db_notif:
        db_notif.is_read = True
        db.commit()
        db.refresh(db_notif)
    return db_notif
