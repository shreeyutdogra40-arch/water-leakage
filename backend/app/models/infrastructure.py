import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class ValveStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    THROTTLED = "throttled"

class SensorType(str, enum.Enum):
    FLOW = "flow"
    PRESSURE = "pressure"
    ULTRASONIC_LEVEL = "ultrasonic_level"
    WATER_QUALITY = "water_quality"

class TankType(str, enum.Enum):
    MAIN_RESERVOIR = "main_reservoir"
    OVERHEAD_TANK = "overhead_tank"
    UNDERGROUND_SUMP = "underground_sump"

class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    material = Column(String(50), default="CPVC / HDPE", nullable=False)
    diameter_mm = Column(Float, default=50.0, nullable=False)
    max_pressure_bar = Column(Float, default=6.0, nullable=False)
    nominal_pressure_bar = Column(Float, default=3.5, nullable=False)
    normal_flow_lpm = Column(Float, default=45.0, nullable=False)
    valve_status = Column(Enum(ValveStatus), default=ValveStatus.OPEN, nullable=False)
    is_isolated = Column(Boolean, default=False, nullable=False)
    current_flow_lpm = Column(Float, default=0.0, nullable=False)
    current_pressure_bar = Column(Float, default=3.5, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="pipelines")
    building = relationship("Building", back_populates="pipelines")
    sensors = relationship("Sensor", back_populates="pipeline")
    leakage_incidents = relationship("LeakageIncident", back_populates="pipeline")
    valve_actions = relationship("ValveAction", back_populates="pipeline")

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="SET NULL"), nullable=True)
    tank_id = Column(Integer, ForeignKey("water_tanks.id", ondelete="SET NULL"), nullable=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="SET NULL"), nullable=True)
    sensor_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    hardware_model = Column(String(50), default="ESP32 + YF-S201", nullable=False)
    is_online = Column(Boolean, default=True, nullable=False)
    last_heartbeat = Column(DateTime, default=datetime.utcnow, nullable=False)
    battery_level = Column(Float, default=100.0, nullable=False)
    calibration_factor = Column(Float, default=7.5, nullable=False) # e.g. pulses per second for 1 LPM
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    pipeline = relationship("Pipeline", back_populates="sensors")
    tank = relationship("WaterTank", back_populates="sensors")
    household = relationship("Household", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")

class WaterTank(Base):
    __tablename__ = "water_tanks"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    tank_type = Column(Enum(TankType), default=TankType.OVERHEAD_TANK, nullable=False)
    capacity_litres = Column(Float, default=20000.0, nullable=False)
    current_level_litres = Column(Float, default=16500.0, nullable=False)
    current_level_percentage = Column(Float, default=82.5, nullable=False)
    height_meters = Column(Float, default=3.5, nullable=False)
    low_level_threshold_pct = Column(Float, default=25.0, nullable=False)
    is_filling = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="water_tanks")
    building = relationship("Building", back_populates="water_tanks")
    sensors = relationship("Sensor", back_populates="tank")
    supply_records = relationship("WaterSupplyRecord", back_populates="tank")
