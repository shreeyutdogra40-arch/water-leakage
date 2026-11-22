from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.incidents import ValveAction, ValveActionType
from app.simulator.engine import simulator
from app.schemas.actions import SimulationInjectRequest

router = APIRouter(prefix="/simulation", tags=["IoT Simulator Controls"])

@router.get("/state")
def get_simulation_state():
    return {
        "is_running": simulator.is_running,
        "active_scenario": simulator.active_anomaly_scenario,
        "target_pipeline_id": simulator.anomaly_target_pipeline_id,
        "ticks_generated": simulator.tick_counter
    }

@router.post("/toggle")
def toggle_simulation():
    if simulator.is_running:
        simulator.stop()
    else:
        simulator.start()
    return {"is_running": simulator.is_running}

@router.post("/inject")
def inject_anomaly(req: SimulationInjectRequest, db: Session = Depends(get_db)):
    valid_scenarios = ["pipe_burst", "micro_leak", "pressure_drop", "sensor_offline", "tank_drain"]
    if req.scenario not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{req.scenario}'. Allowed: {valid_scenarios}"
        )

    # Ensure simulation is running
    if not simulator.is_running:
        simulator.start()

    simulator.inject_scenario(req.scenario, req.pipeline_id)
    return {
        "status": "success",
        "scenario": req.scenario,
        "target_pipeline_id": req.pipeline_id,
        "message": f"Simulated {req.scenario} anomaly is now live in hydraulic engine."
    }

@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    simulator.reset_scenarios()

    # Reopen any pipelines that were closed during testing
    pipelines = db.query(Pipeline).all()
    for p in pipelines:
        p.valve_status = ValveStatus.OPEN
        p.is_isolated = False
        p.current_flow_lpm = p.normal_flow_lpm
        p.current_pressure_bar = p.nominal_pressure_bar
    db.commit()

    return {"status": "success", "message": "Simulation anomalies cleared and pipelines restored."}
