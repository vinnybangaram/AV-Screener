from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.utils.config import settings
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from typing import List

def send_email_notification(to_email: str, subject: str, content: str):
    """Sends email alert via SendGrid."""
    if not settings.SENDGRID_API_KEY:
        print("SENDGRID_API_KEY missing - skipping email")
        return
        
    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        html_content=content
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent! Status: {response.status_code}")
    except Exception as e:
        print(f"SendGrid Error: {e}")

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
