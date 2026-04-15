from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    role = Column(String, default="user") # 'user', 'admin'
    plan = Column(String, default="free") # 'free', 'pro', 'institutional'
    login_count = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    user_sessions = relationship("AdminSession", back_populates="user")
    events = relationship("ActivityEvent", back_populates="user")
    receipts = relationship("NotificationReceipt", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

class AdminSession(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    user = relationship("User", back_populates="user_sessions")

class AdminNotification(Base):
    __tablename__ = "admin_notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(Text)
    target_group = Column(String) # 'all', 'free', 'pro', 'inactive'
    importance = Column(String, default="normal") # 'normal', 'high', 'urgent'
    created_at = Column(DateTime, default=datetime.utcnow)
    is_broadcast = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))

    receipts = relationship("NotificationReceipt", back_populates="notification")

class NotificationReceipt(Base):
    __tablename__ = "notification_receipts"
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("admin_notifications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="receipts")
    notification = relationship("AdminNotification", back_populates="receipts")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_name = Column(String)
    status = Column(String) # 'active', 'canceled', 'expired'
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    amount = Column(Integer, default=0)
    currency = Column(String, default="INR")
    
    user = relationship("User", back_populates="subscriptions")

class ActivityEvent(Base):
    __tablename__ = "activity_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(String) # 'login', 'search', 'chart_view', 'screener_usage'
    symbol = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="events")
