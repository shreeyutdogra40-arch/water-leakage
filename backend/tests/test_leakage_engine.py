import pytest
from sqlalchemy.orm import Session
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.incidents import LeakageIncident, IncidentSeverity, IncidentStatus
from app.services.leakage_detector import leakage_engine

def test_leakage_detector_normal_readings(db: Session):
    pipeline = db.query(Pipeline).filter(Pipeline.code == "PIPE-TWR-A").first()
    # Normal flow and pressure
    incident = leakage_engine.evaluate_pipeline_telemetry(
        db=db,
        pipeline=pipeline,
        current_flow=pipeline.normal_flow_lpm,
        current_pressure=pipeline.nominal_pressure_bar,
        sum_downstream_household_flow=pipeline.normal_flow_lpm * 0.95
    )
    assert incident is None

def test_leakage_detector_burst_pipe_with_persistence(db: Session):
    pipeline = db.query(Pipeline).filter(Pipeline.code == "PIPE-TWR-B").first()
    leakage_engine.anomaly_buffers[pipeline.id] = [] # reset buffer

    # Supply 3 consecutive burst ticks to satisfy persistence threshold
    incident = None
    for _ in range(3):
        incident = leakage_engine.evaluate_pipeline_telemetry(
            db=db,
            pipeline=pipeline,
            current_flow=75.0, # surging flow
            current_pressure=1.2, # collapsed pressure (nominal is 3.4)
        )

    assert incident is not None
    assert incident.severity == IncidentSeverity.CRITICAL
    assert "Pipe Burst" in incident.detection_reason
    assert incident.status == IncidentStatus.DETECTED

def test_ml_isolation_forest_anomaly_detection():
    # Normal diurnal residential profile
    normal_curve = [
        2.0, 1.5, 1.0, 1.0, 3.0, 8.0, 25.0, 35.0, 28.0, 15.0,
        12.0, 14.0, 16.0, 14.0, 12.0, 11.0, 15.0, 22.0, 32.0, 30.0,
        24.0, 16.0, 8.0, 4.0
    ]
    is_anomaly, conf = leakage_engine.score_hourly_consumption_anomaly(normal_curve)
    assert is_anomaly is False or is_anomaly == False

    # Highly anomalous profile: flat constant high consumption 50 LPM across all 24 hours (continuous underground pipe break)
    anomalous_curve = [55.0] * 24
    is_anomaly, conf = leakage_engine.score_hourly_consumption_anomaly(anomalous_curve)
    assert is_anomaly is True or is_anomaly == True
    assert conf > 0.70
