from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.database import get_db
from app.models.infrastructure import Pipeline
from app.models.incidents import LeakageIncident, IncidentStatus, IncidentSeverity, NotificationType
from app.models.user import User, UserRole
from app.schemas.leakage import IncidentResponse, IncidentStatusUpdate, IncidentDetectRequest
from app.services.auth_service import get_current_user, require_roles
from app.services.leakage_detector import leakage_engine
from app.services.automation_service import AutomationService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/leakage", tags=["Leakage Detection"])

class MLAnalyzeRequest(BaseModel):
    hourly_consumption_24h: List[float]

@router.get("/incidents", response_model=List[IncidentResponse])
def get_incidents(
    status_filter: Optional[IncidentStatus] = Query(None),
    severity_filter: Optional[IncidentSeverity] = Query(None),
    pipeline_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(LeakageIncident)
    if status_filter:
        query = query.filter(LeakageIncident.status == status_filter)
    if severity_filter:
        query = query.filter(LeakageIncident.severity == severity_filter)
    if pipeline_id:
        query = query.filter(LeakageIncident.pipeline_id == pipeline_id)

    incidents = query.order_by(desc(LeakageIncident.detected_at)).all()

    result = []
    for inc in incidents:
        resp = IncidentResponse.model_validate(inc)
        if inc.pipeline:
            resp.pipeline_code = inc.pipeline.code
            resp.pipeline_name = inc.pipeline.name
        if inc.building:
            resp.building_name = inc.building.name
        if inc.household:
            resp.household_unit = inc.household.unit_number
        if inc.assigned_technician:
            resp.assigned_technician_name = inc.assigned_technician.full_name
        result.append(resp)
    return result

@router.post("/detect", response_model=IncidentResponse)
def trigger_detection(req: IncidentDetectRequest, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == req.pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    incident = leakage_engine.evaluate_pipeline_telemetry(
        db=db,
        pipeline=pipeline,
        current_flow=req.flow_rate,
        current_pressure=req.pressure_reading
    )

    if not incident:
        # If force_severity was provided for testing:
        if req.force_severity:
            incident = leakage_engine._record_candidate(
                db=db,
                pipeline=pipeline,
                current_flow=req.flow_rate,
                current_pressure=req.pressure_reading,
                severity=req.force_severity,
                confidence=0.95,
                reason=req.reason or "Manual diagnostic test trigger"
            )

    if not incident:
        raise HTTPException(
            status_code=400,
            detail="Parameters did not exceed anomaly threshold. Flow and pressure are within operational bounds."
        )

    if incident.severity == IncidentSeverity.CRITICAL:
        AutomationService.handle_critical_incident(db, incident)

    resp = IncidentResponse.model_validate(incident)
    resp.pipeline_code = pipeline.code
    resp.pipeline_name = pipeline.name
    return resp

@router.patch("/incidents/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: int,
    update: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MAINTENANCE]))
):
    incident = db.query(LeakageIncident).filter(LeakageIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = update.status
    if update.assigned_to_user_id is not None:
        incident.assigned_to_user_id = update.assigned_to_user_id
    if update.notes:
        incident.notes = (incident.notes or "") + f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {update.notes}"

    if update.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
        incident.resolved_at = datetime.utcnow()
        # If pipeline was isolated, ask user or allow manual reopening
        NotificationService.create_notification(
            db=db,
            title=f"Incident #{incident.id} Resolved",
            message=f"Leakage incident on {incident.pipeline.name if incident.pipeline else 'pipeline'} marked as {update.status.value.upper()} by {current_user.full_name}.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.LOW,
            incident_id=incident.id
        )

    db.commit()
    db.refresh(incident)

    resp = IncidentResponse.model_validate(incident)
    if incident.pipeline:
        resp.pipeline_code = incident.pipeline.code
        resp.pipeline_name = incident.pipeline.name
    if incident.assigned_technician:
        resp.assigned_technician_name = incident.assigned_technician.full_name
    return resp

@router.post("/ml-analyze")
def run_ml_consumption_analysis(req: MLAnalyzeRequest):
    """Evaluates a 24-hour hourly consumption curve using the Isolation Forest model."""
    is_anomaly, confidence = leakage_engine.score_hourly_consumption_anomaly(req.hourly_consumption_24h)
    return {
        "model": "IsolationForest(contamination=0.08)",
        "is_anomaly": is_anomaly,
        "confidence_score": round(confidence, 3),
        "verdict": "ABNORMAL CONSUMPTION DETECTED" if is_anomaly else "NORMAL DIURNAL PATTERN",
        "description": "Unusual consumption profile identified by machine learning algorithm comparing against trained 24-hour residential baseline." if is_anomaly else "Flow curve aligns with typical residential morning/evening consumption peaks."
    }
