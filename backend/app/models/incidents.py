import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, enum.Enum):
    DETECTED = "detected"
    ACKNOWLEDGED = "acknowledged"
    ASSIGNED = "assigned"
    RESOLVED = "resolved"
    CLOSED = "closed"

class NotificationType(str, enum.Enum):
    LEAKAGE = "leakage"
    LOW_TANK = "low_tank"
    PRESSURE_ANOMALY = "pressure_anomaly"
    OFFLINE_SENSOR = "offline_sensor"
    QUOTA_EXCEEDED = "quota_exceeded"
    VALVE_ACTION = "valve_action"
    SYSTEM_INFO = "system_info"

class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class ValveActionType(str, enum.Enum):
    MANUAL_OPEN = "manual_open"
    MANUAL_CLOSE = "manual_close"
    AUTO_ISOLATION = "auto_isolation"
    EMERGENCY_SHUTDOWN = "emergency_shutdown"

class LeakageIncident(Base):
    __tablename__ = "leakage_incidents"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="SET NULL"), nullable=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True, index=True)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False, index=True)
    flow_rate = Column(Float, nullable=False)
    pressure_reading = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.85, nullable=False) # 0.0 - 1.0 (85%)
    detection_reason = Column(String(255), nullable=False) # e.g. "Sudden pressure drop > 1.2 bar with continuous elevated flow"
    status = Column(Enum(IncidentStatus), default=IncidentStatus.DETECTED, nullable=False, index=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    estimated_water_lost_litres = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    pipeline = relationship("Pipeline", back_populates="leakage_incidents")
    household = relationship("Household", back_populates="leakage_incidents")
    building = relationship("Building", back_populates="leakage_incidents")
    assigned_technician = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_to_user_id])
    maintenance_records = relationship("MaintenanceRecord", back_populates="incident")
    notifications = relationship("Notification", back_populates="incident")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True) # None = broadcast to all
    incident_id = Column(Integer, ForeignKey("leakage_incidents.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(Enum(NotificationType), default=NotificationType.LEAKAGE, nullable=False)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")
    incident = relationship("LeakageIncident", back_populates="notifications")

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("leakage_incidents.id", ondelete="CASCADE"), nullable=False)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    technician_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED, nullable=False)
    work_description = Column(Text, nullable=False)
    parts_replaced = Column(String(255), nullable=True) # e.g. "Solvent cement, 2m CPVC pipe, O-ring seal"
    cost = Column(Float, default=0.0, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    incident = relationship("LeakageIncident", back_populates="maintenance_records")
    technician = relationship("User", back_populates="maintenance_records")

class ValveAction(Base):
    __tablename__ = "valve_actions"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(Enum(ValveActionType), nullable=False)
    reason = Column(String(255), nullable=False)
    previous_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    pipeline = relationship("Pipeline", back_populates="valve_actions")
    triggered_by_user = relationship("User", back_populates="valve_actions")
