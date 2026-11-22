from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.infrastructure import Pipeline
from app.models.incidents import ValveAction
from app.models.user import User, UserRole
from app.schemas.actions import ValveControlRequest, ValveActionResponse
from app.schemas.monitoring import PipelineResponse
from app.services.auth_service import require_roles, get_current_user
from app.services.automation_service import AutomationService

router = APIRouter(prefix="/valves", tags=["Valve Controls & Automation"])

@router.post("/{pipeline_id}/control", response_model=PipelineResponse)
def control_valve(
    pipeline_id: int,
    req: ValveControlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MAINTENANCE]))
):
    try:
        pipeline = AutomationService.control_valve(
            db=db,
            pipeline_id=pipeline_id,
            action_type=req.action,
            reason=req.reason,
            user=current_user
        )
        return pipeline
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{pipeline_id}/status")
def get_valve_status(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return {
        "pipeline_id": pipeline.id,
        "pipeline_code": pipeline.code,
        "valve_status": pipeline.valve_status.value,
        "is_isolated": pipeline.is_isolated,
        "current_flow_lpm": pipeline.current_flow_lpm,
        "current_pressure_bar": pipeline.current_pressure_bar,
        "last_action_at": pipeline.updated_at.isoformat()
    }

@router.get("/actions/log", response_model=List[ValveActionResponse])
def get_valve_actions_log(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    actions = db.query(ValveAction).order_by(desc(ValveAction.timestamp)).limit(limit).all()
    results = []
    for a in actions:
        resp = ValveActionResponse.model_validate(a)
        if a.pipeline:
            resp.pipeline_name = a.pipeline.name
        if a.triggered_by_user:
            resp.triggered_by_name = a.triggered_by_user.full_name
        else:
            resp.triggered_by_name = "Automated System Guard"
        results.append(resp)
    return results
