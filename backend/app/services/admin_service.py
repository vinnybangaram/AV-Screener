from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime, timedelta
from app.models.user import User, ActivityEvent, Subscription, AdminNotification, NotificationReceipt
from app.models.community import Feedback
import io
import csv

class AdminService:
    def get_analytics_overview(self, db: Session):
        total_users = db.query(func.count(User.id)).scalar()
        
        # Actve Users
        today = datetime.utcnow().date()
        dau = db.query(func.count(distinct(ActivityEvent.user_id)))\
                .filter(func.date(ActivityEvent.created_at) == today).scalar()
        
        last_7_days = datetime.utcnow() - timedelta(days=7)
        wau = db.query(func.count(distinct(ActivityEvent.user_id)))\
                .filter(ActivityEvent.created_at >= last_7_days).scalar()
        
        last_30_days = datetime.utcnow() - timedelta(days=30)
        mau = db.query(func.count(distinct(ActivityEvent.user_id)))\
                .filter(ActivityEvent.created_at >= last_30_days).scalar()
        
        paid_users = db.query(func.count(User.id)).filter(User.plan != "free").scalar()
        
        # Plan breakdown
        plans = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
        plan_breakdown = {p[0]: p[1] for p in plans}
        
        # Recent activity
        recent_logins = db.query(User).order_by(User.last_login_at.desc()).limit(10).all()
        
        return {
            "total_users": total_users,
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "paid_users": paid_users,
            "plan_breakdown": plan_breakdown,
            "recent_logins": [
                {
                    "id": u.id, 
                    "name": u.name, 
                    "email": u.email, 
                    "plan": u.plan, 
                    "role": u.role,
                    "last_login": u.last_login_at
                } for u in recent_logins
            ]
        }

    def broadcast_notification(self, db: Session, title: str, message: str, group: str, admin_id: int):
        # 1. Create Notification Record
        notif = AdminNotification(
            title=title, 
            message=message, 
            target_group=group, 
            created_by=admin_id
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # 2. Identify Target Users
        query = db.query(User)
        if group == "free":
            query = query.filter(User.plan == "free")
        elif group == "paid":
            query = query.filter(User.plan != "free")
        elif group == "inactive":
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            query = query.filter(User.last_login_at < thirty_days_ago)
            
        target_users = query.all()
        
        # 3. Create Receipts
        receipts = []
        for u in target_users:
            receipts.append(NotificationReceipt(notification_id=notif.id, user_id=u.id))
        
        db.bulk_save_objects(receipts)
        db.commit()
        
        return {"status": "success", "recipients_count": len(target_users)}

    def export_users_csv(self, db: Session):
        users = db.query(User).all()
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["ID", "Name", "Email", "Plan", "Logins", "Last Login", "Joined At"])
        for u in users:
            writer.writerow([u.id, u.name, u.email, u.plan, u.login_count, u.last_login_at, u.created_at])
            
        return output.getvalue()
        
    def get_feedbacks(self, db: Session):
        # Optimized with single join to avoid N+1 queries
        feedbacks = db.query(Feedback, User.name, User.email)\
            .outerjoin(User, Feedback.user_id == User.id)\
            .order_by(Feedback.created_at.desc()).all()
            
        results = []
        for f, user_name, user_email in feedbacks:
            results.append({
                "id": f.id,
                "user": {"name": user_name or "Trader", "email": user_email or ""},
                "category": f.category,
                "rating": f.rating,
                "message": f.message,
                "page_context": f.page_context,
                "created_at": f.created_at
            })
        return results

admin_service = AdminService()
