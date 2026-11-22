from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.infrastructure import WaterTank
from app.models.community import Building, Household
from app.models.telemetry import WaterSupplyRecord, ConsumptionRecord
from app.models.user import User
from app.schemas.supply import (
    WaterTankResponse, BuildingSummaryResponse, HouseholdResponse, WaterSupplyRecordResponse
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/water", tags=["Water Supply & Consumption"])

@router.get("/tanks", response_model=List[WaterTankResponse])
def get_tanks(db: Session = Depends(get_db)):
    return db.query(WaterTank).all()

@router.get("/supply", response_model=List[WaterSupplyRecordResponse])
def get_supply_records(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.query(WaterSupplyRecord).order_by(desc(WaterSupplyRecord.supply_start)).limit(limit).all()
    results = []
    for r in records:
        resp = WaterSupplyRecordResponse.model_validate(r)
        if r.tank:
            resp.tank_name = r.tank.name
        results.append(resp)
    return results

@router.get("/buildings", response_model=List[BuildingSummaryResponse])
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building).all()
    results = []
    for b in buildings:
        tank = next((t for t in b.water_tanks), None)
        pipeline = next((p for p in b.pipelines), None)
        today_usage = sum(h.current_day_usage_litres for h in b.households)

        results.append(BuildingSummaryResponse(
            id=b.id,
            community_id=b.community_id,
            name=b.name,
            block_code=b.block_code,
            total_households=b.total_households,
            today_consumption_litres=round(today_usage, 1),
            current_flow_lpm=pipeline.current_flow_lpm if pipeline else 0.0,
            tank_level_pct=tank.current_level_percentage if tank else None,
            tank_name=tank.name if tank else None,
            active_leaks_count=len(b.leakage_incidents)
        ))
    return results

@router.get("/households", response_model=List[HouseholdResponse])
def get_households(building_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Household)
    if building_id:
        query = query.filter(Household.building_id == building_id)
    
    households = query.all()
    results = []
    for h in households:
        pct = (h.current_day_usage_litres / h.daily_quota_litres * 100.0) if h.daily_quota_litres > 0 else 0.0
        results.append(HouseholdResponse(
            id=h.id,
            building_id=h.building_id,
            building_name=h.building.name if h.building else None,
            unit_number=h.unit_number,
            resident_name=h.resident_name,
            contact_phone=h.contact_phone,
            meter_id=h.meter_id,
            daily_quota_litres=h.daily_quota_litres,
            current_day_usage_litres=round(h.current_day_usage_litres, 1),
            quota_usage_percentage=round(pct, 1),
            has_anomaly=(pct > 110.0)
        ))
    return results

@router.get("/my-consumption")
def get_my_consumption(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.household_id:
        return {
            "household_id": None,
            "message": "User not assigned to a household meter.",
            "today_usage_litres": 0.0,
            "quota_litres": 600.0,
            "history": []
        }
    
    household = db.query(Household).filter(Household.id == current_user.household_id).first()
    history = db.query(ConsumptionRecord).filter(
        ConsumptionRecord.household_id == household.id
    ).order_by(desc(ConsumptionRecord.record_date)).limit(14).all()

    return {
        "household_id": household.id,
        "unit_number": household.unit_number,
        "building_name": household.building.name if household.building else "",
        "resident_name": household.resident_name,
        "meter_id": household.meter_id,
        "today_usage_litres": round(household.current_day_usage_litres, 1),
        "daily_quota_litres": household.daily_quota_litres,
        "quota_percentage": round((household.current_day_usage_litres / household.daily_quota_litres) * 100.0, 1),
        "history": [{
            "date": h.record_date.isoformat(),
            "volume_litres": h.volume_consumed_litres,
            "peak_flow": h.peak_flow_rate,
            "anomaly": h.abnormal_consumption_detected
        } for h in history]
    }
