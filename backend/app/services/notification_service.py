from typing import Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.models.incidents import Notification, NotificationType, IncidentSeverity
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("notification_service")

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        title: str,
        message: str,
        alert_type: NotificationType,
        severity: IncidentSeverity = IncidentSeverity.MEDIUM,
        user_id: Optional[int] = None,
        incident_id: Optional[int] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            incident_id=incident_id,
            title=title,
            message=message,
            alert_type=alert_type,
            severity=severity,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Log simulated external dispatch
        logger.info(f"🚨 [ALERT DISPATCH] [{severity.value.upper()}] {title}: {message}")
        if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            logger.info(f"📲 [TELEGRAM/SMS GATEWAY] Notification dispatched to Community Operations Group: {title}")

        return notification

    @staticmethod
    async def broadcast_alert(
        db: Session,
        title: str,
        message: str,
        alert_type: NotificationType,
        severity: IncidentSeverity = IncidentSeverity.MEDIUM,
        incident_id: Optional[int] = None
    ):
        notif = NotificationService.create_notification(
            db=db,
            title=title,
            message=message,
            alert_type=alert_type,
            severity=severity,
            incident_id=incident_id
        )

        # Send WebSocket message to all active dashboards
        await ws_manager.broadcast({
            "type": "NEW_ALERT",
            "data": {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "alert_type": notif.alert_type.value,
                "severity": notif.severity.value,
                "incident_id": notif.incident_id,
                "created_at": notif.created_at.isoformat()
            }
        })
        return notif
