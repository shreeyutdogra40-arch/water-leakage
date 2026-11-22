from typing import List, Dict, Any, Optional
from datetime import date
from pydantic import BaseModel

class DailyConsumptionPoint(BaseModel):
    date: str
    supplied_litres: float
    consumed_litres: float
    wastage_litres: float
    efficiency_pct: float

class BuildingComparisonPoint(BaseModel):
    building_id: int
    building_name: str
    total_consumption_litres: float
    household_avg_litres: float
    quota_litres: float
    excess_litres: float

class WastageAnalysisResponse(BaseModel):
    total_supplied_period_litres: float
    total_consumed_period_litres: float
    total_wastage_litres: float
    leakage_loss_litres: float
    unaccounted_loss_litres: float
    wastage_percentage: float
    financial_loss_estimate: float # in currency units ($ or ₹)
    prevented_wastage_litres: float

class IncidentStatsResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    average_resolution_time_minutes: float
    auto_isolated_count: int
