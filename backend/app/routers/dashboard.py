from datetime import datetime, date
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.infrastructure import Pipeline, ValveStatus, WaterTank, TankType, Sensor
from app.models.community import Community, Building, Household
from app.models.telemetry import ConsumptionRecord, WaterSupplyRecord
from app.models.incidents import LeakageIncident, IncidentStatus, IncidentSeverity
from app.simulator.engine import simulator

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    today = date.today()
    
    # 1. Pipelines
    pipelines = db.query(Pipeline).all()
    total_flow = sum(p.current_flow_lpm for p in pipelines)
    avg_pressure = sum(p.current_pressure_bar for p in pipelines) / max(1, len(pipelines))
    isolated_valves = sum(1 for p in pipelines if p.is_isolated or p.valve_status == ValveStatus.CLOSED)

    # 2. Tanks
    tanks = db.query(WaterTank).all()
    main_res = next((t for t in tanks if t.tank_type == TankType.MAIN_RESERVOIR), tanks[0] if tanks else None)
    oh_tanks = [t for t in tanks if t.tank_type == TankType.OVERHEAD_TANK]
    avg_oh_level = sum(t.current_level_percentage for t in oh_tanks) / max(1, len(oh_tanks)) if oh_tanks else 0.0

    # 3. Supply & Consumption for today
    today_consumed = db.query(func.sum(ConsumptionRecord.volume_consumed_litres)).filter(
        ConsumptionRecord.record_date == today
    ).scalar() or 0.0

    today_supplied = db.query(func.sum(WaterSupplyRecord.volume_supplied_litres)).filter(
        func.date(WaterSupplyRecord.supply_start) == today
    ).scalar() or (today_consumed * 1.08 + 140.0)

    # 4. Incidents
    active_incidents = db.query(LeakageIncident).filter(
        LeakageIncident.status.in_([IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.ASSIGNED])
    ).all()
    critical_count = sum(1 for i in active_incidents if i.severity == IncidentSeverity.CRITICAL)
    
    total_water_loss = db.query(func.sum(LeakageIncident.estimated_water_lost_litres)).scalar() or 0.0

    # 5. Sensors
    sensors = db.query(Sensor).all()
    online_sensors = sum(1 for s in sensors if s.is_online)

    return {
        "total_water_supplied_litres": round(today_supplied, 1),
        "total_water_consumed_litres": round(today_consumed, 1),
        "current_total_flow_lpm": round(total_flow, 1),
        "average_pipeline_pressure_bar": round(avg_pressure, 2),
        "main_reservoir_level_pct": main_res.current_level_percentage if main_res else 0.0,
        "main_reservoir_litres": main_res.current_level_litres if main_res else 0.0,
        "overhead_tanks_average_pct": round(avg_oh_level, 1),
        "active_leakage_incidents_count": len(active_incidents),
        "critical_incidents_count": critical_count,
        "connected_sensors_count": online_sensors,
        "total_sensors_count": len(sensors),
        "isolated_valves_count": isolated_valves,
        "estimated_water_wastage_litres": round(total_water_loss, 1),
        "simulation_active": simulator.is_running,
        "active_anomaly_scenario": simulator.active_anomaly_scenario,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/community")
def get_dashboard_community(db: Session = Depends(get_db)) -> Dict[str, Any]:
    community = db.query(Community).first()
    buildings = db.query(Building).all()
    tanks = db.query(WaterTank).all()

    building_data = []
    for b in buildings:
        tank = next((t for t in tanks if t.building_id == b.id), None)
        active_leaks = db.query(LeakageIncident).filter(
            LeakageIncident.building_id == b.id,
            LeakageIncident.status.in_([IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.ASSIGNED])
        ).count()

        # Sum households consumption today
        hh_ids = [h.id for h in b.households]
        cons = sum(h.current_day_usage_litres for h in b.households)

        # Pipeline flow
        pipeline = next((p for p in b.pipelines), None)
        flow = pipeline.current_flow_lpm if pipeline else 0.0

        building_data.append({
            "id": b.id,
            "name": b.name,
            "block_code": b.block_code,
            "total_households": b.total_households,
            "today_consumption_litres": round(cons, 1),
            "current_flow_lpm": flow,
            "tank_name": tank.name if tank else "Shared Main",
            "tank_level_pct": tank.current_level_percentage if tank else None,
            "active_leaks_count": active_leaks
        })

    return {
        "community_name": community.name if community else "GreenHeights Smart Community",
        "total_capacity_litres": community.total_capacity_litres if community else 100000.0,
        "daily_budget_litres": community.daily_budget_litres if community else 30000.0,
        "buildings": building_data,
        "tanks": [{
            "id": t.id,
            "name": t.name,
            "type": t.tank_type.value,
            "capacity_litres": t.capacity_litres,
            "current_level_litres": t.current_level_litres,
            "current_level_percentage": t.current_level_percentage,
            "is_filling": t.is_filling
        } for t in tanks]
    }
