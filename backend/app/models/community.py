from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    total_capacity_litres = Column(Float, default=100000.0, nullable=False)
    daily_budget_litres = Column(Float, default=30000.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    buildings = relationship("Building", back_populates="community", cascade="all, delete-orphan")
    water_tanks = relationship("WaterTank", back_populates="community", cascade="all, delete-orphan")
    pipelines = relationship("Pipeline", back_populates="community", cascade="all, delete-orphan")
    supply_records = relationship("WaterSupplyRecord", back_populates="community")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    block_code = Column(String(20), nullable=False, unique=True)
    total_households = Column(Integer, default=6, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="buildings")
    households = relationship("Household", back_populates="building", cascade="all, delete-orphan")
    water_tanks = relationship("WaterTank", back_populates="building")
    pipelines = relationship("Pipeline", back_populates="building")
    consumption_records = relationship("ConsumptionRecord", back_populates="building")
    leakage_incidents = relationship("LeakageIncident", back_populates="building")

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(String(20), nullable=False)
    resident_name = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    meter_id = Column(String(50), unique=True, nullable=False)
    daily_quota_litres = Column(Float, default=600.0, nullable=False)
    current_day_usage_litres = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="households")
    residents = relationship("User", back_populates="household")
    sensors = relationship("Sensor", back_populates="household")
    consumption_records = relationship("ConsumptionRecord", back_populates="household")
    leakage_incidents = relationship("LeakageIncident", back_populates="household")
