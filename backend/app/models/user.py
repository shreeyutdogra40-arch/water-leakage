import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MAINTENANCE = "maintenance"
    RESIDENT = "resident"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RESIDENT, nullable=False)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="SET NULL"), nullable=True)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="residents", foreign_keys=[household_id])
    assigned_incidents = relationship("LeakageIncident", back_populates="assigned_technician", foreign_keys="LeakageIncident.assigned_to_user_id")
    maintenance_records = relationship("MaintenanceRecord", back_populates="technician")
    valve_actions = relationship("ValveAction", back_populates="triggered_by_user")
    notifications = relationship("Notification", back_populates="user")
