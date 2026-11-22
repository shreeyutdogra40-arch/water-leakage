from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.infrastructure import Pipeline, Sensor, WaterTank, SensorType
from app.models.telemetry import SensorReading
from app.models.incidents import LeakageIncident, IncidentSeverity
from app.schemas.monitoring import (
    SensorReadingCreate, SensorReadingResponse, SensorDetailResponse, PipelineResponse
)
from app.services.leakage_detector import leakage_engine
from app.services.automation_service import AutomationService

router = APIRouter(prefix="/monitoring", tags=["Live Monitoring"])

@router.get("/live")
def get_live_monitoring_snapshot(db: Session = Depends(get_db)):
    pipelines = db.query(Pipeline).all()
    tanks = db.query(WaterTank).all()
    sensors = db.query(Sensor).all()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "pipelines": [PipelineResponse.model_validate(p) for p in pipelines],
        "tanks": [{
            "id": t.id,
            "name": t.name,
            "type": t.tank_type.value,
            "capacity_litres": t.capacity_litres,
            "current_level_litres": t.current_level_litres,
            "current_level_percentage": t.current_level_percentage,
            "is_filling": t.is_filling
        } for t in tanks],
        "sensor_health": {
            "total": len(sensors),
            "online": sum(1 for s in sensors if s.is_online),
            "offline": sum(1 for s in sensors if not s.is_online),
            "low_battery": sum(1 for s in sensors if s.battery_level < 20.0)
        }
    }

@router.get("/readings", response_model=List[SensorReadingResponse])
def get_sensor_readings(
    sensor_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    anomalies_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if sensor_id:
        query = query.filter(SensorReading.sensor_id == sensor_id)
    if anomalies_only:
        query = query.filter(SensorReading.is_anomaly == True)
    
    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()
    
    result = []
    for r in readings:
        resp = SensorReadingResponse.model_validate(r)
        if r.sensor:
            resp.sensor_code = r.sensor.sensor_code
        result.append(resp)
    return result

@router.post("/readings", status_code=status.HTTP_201_CREATED)
def ingest_iot_reading(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    """Hardware endpoint: ESP32 or gateway pushes telemetry here."""
    sensor = db.query(Sensor).filter(Sensor.sensor_code == reading_in.sensor_code).first()
    if not sensor:
        raise HTTPException(status_code=404, detail=f"Sensor code {reading_in.sensor_code} not registered")

    sensor.last_heartbeat = datetime.utcnow()
    sensor.is_online = True

    reading = SensorReading(
        sensor_id=sensor.id,
        timestamp=reading_in.timestamp or datetime.utcnow(),
        flow_rate_lpm=reading_in.flow_rate_lpm,
        pressure_bar=reading_in.pressure_bar,
        tank_level_percentage=reading_in.tank_level_percentage,
        distance_cm=reading_in.distance_cm,
        water_temperature_c=reading_in.water_temperature_c,
        is_anomaly=False
    )

    # If linked to pipeline, update pipeline live metrics and evaluate leakage
    if sensor.pipeline:
        if reading_in.flow_rate_lpm is not None:
            sensor.pipeline.current_flow_lpm = reading_in.flow_rate_lpm
        if reading_in.pressure_bar is not None:
            sensor.pipeline.current_pressure_bar = reading_in.pressure_bar
        
        incident = leakage_engine.evaluate_pipeline_telemetry(
            db=db,
            pipeline=sensor.pipeline,
            current_flow=sensor.pipeline.current_flow_lpm,
            current_pressure=sensor.pipeline.current_pressure_bar
        )
        if incident:
            reading.is_anomaly = True
            reading.anomaly_reason = incident.detection_reason
            if incident.severity == IncidentSeverity.CRITICAL:
                AutomationService.handle_critical_incident(db, incident)

    # If linked to tank, update tank level
    if sensor.tank and reading_in.tank_level_percentage is not None:
        sensor.tank.current_level_percentage = reading_in.tank_level_percentage
        sensor.tank.current_level_litres = sensor.tank.capacity_litres * (reading_in.tank_level_percentage / 100.0)

    db.add(reading)
    db.commit()
    return {"status": "ok", "reading_id": reading.id, "anomaly_detected": reading.is_anomaly}

@router.get("/sensors", response_model=List[SensorDetailResponse])
def get_sensors(db: Session = Depends(get_db)):
    return db.query(Sensor).all()
