from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.incidents import Notification
from app.schemas.actions import NotificationResponse

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_alerts(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(desc(Notification.created_at)).limit(limit).all()

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unread_count": count}

@router.patch("/{alert_id}/read", response_model=NotificationResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Notification).filter(Notification.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/read-all")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
    return {"status": "ok", "message": "All alerts marked as read"}
