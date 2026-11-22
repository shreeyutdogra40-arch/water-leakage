from typing import Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.config import settings
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.incidents import (
    LeakageIncident, IncidentSeverity, ValveAction, ValveActionType, NotificationType
)
from app.models.user import User
from app.services.notification_service import NotificationService

logger = logging.getLogger("automation_service")

class AutomationService:
    @staticmethod
    def handle_critical_incident(db: Session, incident: LeakageIncident) -> bool:
        """
        Executes automated isolation for branch / building pipelines if auto-isolation is enabled.
        Safety enforcement: Main community supply trunks are PROTECTED from automated closure.
        """
        if not settings.AUTO_ISOLATION_ENABLED:
            logger.info("Auto-isolation is disabled by system configuration.")
            return False

        if incident.severity != IncidentSeverity.CRITICAL:
            return False

        pipeline = db.query(Pipeline).filter(Pipeline.id == incident.pipeline_id).first()
        if not pipeline or pipeline.is_isolated:
            return False

        # Safety Check: Never close the main community supply line automatically
        if pipeline.building_id is None and "main" in pipeline.name.lower():
            logger.warning(
                f"SAFETY GUARD: Pipeline {pipeline.name} is a main community supply line. "
                "Automated isolation denied. Administrator manual override required."
            )
            NotificationService.create_notification(
                db=db,
                title="SAFETY ALERT: Main Line Critical Leak",
                message=f"Critical leak detected on main supply line {pipeline.name}. Auto-isolation was halted by safety policy. Manual admin intervention required!",
                alert_type=NotificationType.VALVE_ACTION,
                severity=IncidentSeverity.CRITICAL,
                incident_id=incident.id
            )
            return False

        # Execute automated isolation
        prev_status = pipeline.valve_status.value
        pipeline.valve_status = ValveStatus.CLOSED
        pipeline.is_isolated = True
        pipeline.current_flow_lpm = 0.0

        # Record valve action
        action = ValveAction(
            pipeline_id=pipeline.id,
            triggered_by_user_id=None, # System Automated
            action_type=ValveActionType.AUTO_ISOLATION,
            reason=f"Automated emergency isolation triggered by Critical Leakage Incident #{incident.id}: {incident.detection_reason}",
            previous_status=prev_status,
            new_status=ValveStatus.CLOSED.value,
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit()

        # Log & Notify
        logger.warning(f"⚡ [AUTO-ISOLATION] Pipeline {pipeline.code} ({pipeline.name}) automatically closed and isolated.")
        NotificationService.create_notification(
            db=db,
            title=f"Valve Auto-Isolated: {pipeline.name}",
            message=f"Automatic isolation executed for pipeline {pipeline.code} to prevent catastrophic flooding/wastage. Incident #{incident.id}.",
            alert_type=NotificationType.VALVE_ACTION,
            severity=IncidentSeverity.CRITICAL,
            incident_id=incident.id
        )
        return True

    @staticmethod
    def control_valve(
        db: Session,
        pipeline_id: int,
        action_type: ValveActionType,
        reason: str,
        user: Optional[User] = None
    ) -> Pipeline:
        """Manual control or emergency shutdown by user."""
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            raise ValueError(f"Pipeline with ID {pipeline_id} not found")

        prev_status = pipeline.valve_status.value

        if action_type in [ValveActionType.MANUAL_CLOSE, ValveActionType.EMERGENCY_SHUTDOWN]:
            pipeline.valve_status = ValveStatus.CLOSED
            pipeline.is_isolated = (action_type == ValveActionType.EMERGENCY_SHUTDOWN)
            pipeline.current_flow_lpm = 0.0
            new_status = ValveStatus.CLOSED.value
        elif action_type == ValveActionType.MANUAL_OPEN:
            pipeline.valve_status = ValveStatus.OPEN
            pipeline.is_isolated = False
            new_status = ValveStatus.OPEN.value
        else:
            new_status = prev_status

        action = ValveAction(
            pipeline_id=pipeline.id,
            triggered_by_user_id=user.id if user else None,
            action_type=action_type,
            reason=reason,
            previous_status=prev_status,
            new_status=new_status,
            timestamp=datetime.utcnow()
        )
        db.add(action)
        db.commit()
        db.refresh(pipeline)

        NotificationService.create_notification(
            db=db,
            title=f"Valve Control: {pipeline.name}",
            message=f"Valve was set to {new_status.upper()} ({action_type.value}) by {user.full_name if user else 'System'}. Reason: {reason}",
            alert_type=NotificationType.VALVE_ACTION,
            severity=IncidentSeverity.MEDIUM
        )

        return pipeline
