from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
from app.models.infrastructure import TankType

class WaterTankResponse(BaseModel):
    id: int
    community_id: int
    building_id: Optional[int]
    name: str
    tank_type: TankType
    capacity_litres: float
    current_level_litres: float
    current_level_percentage: float
    height_meters: float
    low_level_threshold_pct: float
    is_filling: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class BuildingSummaryResponse(BaseModel):
    id: int
    community_id: int
    name: str
    block_code: str
    total_households: int
    today_consumption_litres: float
    current_flow_lpm: float
    tank_level_pct: Optional[float] = None
    tank_name: Optional[str] = None
    active_leaks_count: int

    class Config:
        from_attributes = True

class HouseholdResponse(BaseModel):
    id: int
    building_id: int
    building_name: Optional[str] = None
    unit_number: str
    resident_name: str
    contact_phone: Optional[str]
    meter_id: str
    daily_quota_litres: float
    current_day_usage_litres: float
    quota_usage_percentage: float
    has_anomaly: bool

    class Config:
        from_attributes = True

class WaterSupplyRecordResponse(BaseModel):
    id: int
    community_id: int
    tank_id: Optional[int]
    tank_name: Optional[str] = None
    supply_source: str
    volume_supplied_litres: float
    supply_start: datetime
    supply_end: Optional[datetime]
    cost_estimate: float
    created_at: datetime

    class Config:
        from_attributes = True
