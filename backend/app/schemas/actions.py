from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.incidents import ValveActionType, NotificationType, IncidentSeverity, MaintenanceStatus

class ValveControlRequest(BaseModel):
    action: ValveActionType # MANUAL_OPEN, MANUAL_CLOSE, EMERGENCY_SHUTDOWN
    reason: str

class ValveActionResponse(BaseModel):
    id: int
    pipeline_id: int
    pipeline_name: Optional[str] = None
    triggered_by_user_id: Optional[int]
    triggered_by_name: Optional[str] = None
    action_type: ValveActionType
    reason: str
    previous_status: str
    new_status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int]
    incident_id: Optional[int]
    title: str
    message: str
    alert_type: NotificationType
    severity: IncidentSeverity
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MaintenanceRecordCreate(BaseModel):
    incident_id: int
    work_description: str
    parts_replaced: Optional[str] = None
    cost: Optional[float] = 0.0
    status: Optional[MaintenanceStatus] = MaintenanceStatus.IN_PROGRESS

class MaintenanceRecordResponse(BaseModel):
    id: int
    incident_id: int
    pipeline_id: int
    technician_user_id: Optional[int]
    technician_name: Optional[str] = None
    status: MaintenanceStatus
    work_description: str
    parts_replaced: Optional[str]
    cost: float
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationInjectRequest(BaseModel):
    scenario: str # "pipe_burst", "micro_leak", "pressure_drop", "sensor_offline", "tank_drain", "reset_normal"
    pipeline_id: Optional[int] = None
    severity: Optional[str] = "high"
