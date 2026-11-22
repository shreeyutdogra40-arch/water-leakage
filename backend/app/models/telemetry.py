from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    flow_rate_lpm = Column(Float, nullable=True)
    pressure_bar = Column(Float, nullable=True)
    tank_level_percentage = Column(Float, nullable=True)
    distance_cm = Column(Float, nullable=True) # ultrasonic sensor raw distance
    water_temperature_c = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_reason = Column(String(200), nullable=True)

    sensor = relationship("Sensor", back_populates="readings")

    __table_args__ = (
        Index("idx_sensor_time", "sensor_id", "timestamp"),
    )

class ConsumptionRecord(Base):
    __tablename__ = "consumption_records"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True, index=True)
    record_date = Column(Date, default=date.today, nullable=False, index=True)
    volume_consumed_litres = Column(Float, default=0.0, nullable=False)
    peak_flow_rate = Column(Float, default=0.0, nullable=False)
    abnormal_consumption_detected = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    household = relationship("Household", back_populates="consumption_records")
    building = relationship("Building", back_populates="consumption_records")

class WaterSupplyRecord(Base):
    __tablename__ = "water_supply_records"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    tank_id = Column(Integer, ForeignKey("water_tanks.id", ondelete="SET NULL"), nullable=True)
    supply_source = Column(String(50), default="Municipal Grid", nullable=False) # Municipal, Groundwater Sump, Water Tanker
    volume_supplied_litres = Column(Float, nullable=False)
    supply_start = Column(DateTime, nullable=False)
    supply_end = Column(DateTime, nullable=True)
    cost_estimate = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="supply_records")
    tank = relationship("WaterTank", back_populates="supply_records")
