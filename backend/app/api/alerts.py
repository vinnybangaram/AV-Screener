from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert
from app.utils.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/alerts")
async def get_alerts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).limit(50).all()

@router.get("/alerts/unread-count")
async def get_unread_count(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    count = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read == False).count()
    return {"count": count}

@router.post("/alerts/read/{alert_id}")
async def mark_read(alert_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"status": "success"}

@router.post("/alerts/read-all")
async def mark_all_read(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}
