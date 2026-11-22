from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.infrastructure import SensorType

class SensorReadingCreate(BaseModel):
    sensor_code: str
    flow_rate_lpm: Optional[float] = None
    pressure_bar: Optional[float] = None
    tank_level_percentage: Optional[float] = None
    distance_cm: Optional[float] = None
    water_temperature_c: Optional[float] = None
    timestamp: Optional[datetime] = None

class SensorReadingResponse(BaseModel):
    id: int
    sensor_id: int
    sensor_code: Optional[str] = None
    timestamp: datetime
    flow_rate_lpm: Optional[float]
    pressure_bar: Optional[float]
    tank_level_percentage: Optional[float]
    distance_cm: Optional[float]
    is_anomaly: bool
    anomaly_reason: Optional[str]

    class Config:
        from_attributes = True

class SensorDetailResponse(BaseModel):
    id: int
    sensor_code: str
    name: str
    sensor_type: SensorType
    hardware_model: str
    is_online: bool
    last_heartbeat: datetime
    battery_level: float
    pipeline_id: Optional[int]
    tank_id: Optional[int]
    household_id: Optional[int]

    class Config:
        from_attributes = True

class PipelineResponse(BaseModel):
    id: int
    community_id: int
    building_id: Optional[int]
    name: str
    code: str
    material: str
    diameter_mm: float
    max_pressure_bar: float
    nominal_pressure_bar: float
    normal_flow_lpm: float
    valve_status: str
    is_isolated: bool
    current_flow_lpm: float
    current_pressure_bar: float
    updated_at: datetime

    class Config:
        from_attributes = True

class LiveTelemetryOverview(BaseModel):
    total_water_supplied_litres: float
    total_water_consumed_litres: float
    current_total_flow_lpm: float
    average_pipeline_pressure_bar: float
    main_reservoir_level_pct: float
    main_reservoir_litres: float
    overhead_tanks_average_pct: float
    active_leakage_incidents_count: int
    critical_incidents_count: int
    connected_sensors_count: int
    total_sensors_count: int
    isolated_valves_count: int
    estimated_water_wastage_litres: float
    simulation_active: bool
    timestamp: datetime
