from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.incidents import IncidentSeverity, IncidentStatus

class IncidentDetectRequest(BaseModel):
    pipeline_id: int
    flow_rate: float
    pressure_reading: float
    reason: Optional[str] = None
    force_severity: Optional[IncidentSeverity] = None

class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    assigned_to_user_id: Optional[int] = None
    notes: Optional[str] = None

class IncidentResponse(BaseModel):
    id: int
    pipeline_id: int
    pipeline_code: Optional[str] = None
    pipeline_name: Optional[str] = None
    household_id: Optional[int] = None
    household_unit: Optional[str] = None
    building_id: Optional[int] = None
    building_name: Optional[str] = None
    detected_at: datetime
    severity: IncidentSeverity
    flow_rate: float
    pressure_reading: float
    confidence_score: float
    detection_reason: str
    status: IncidentStatus
    assigned_to_user_id: Optional[int] = None
    assigned_technician_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None
    estimated_water_lost_litres: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
