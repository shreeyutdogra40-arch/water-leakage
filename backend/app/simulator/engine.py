import asyncio
import random
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional

from app.database import SessionLocal
from app.models.infrastructure import Pipeline, ValveStatus, WaterTank, TankType, Sensor, SensorType
from app.models.community import Household, Building
from app.models.telemetry import SensorReading, ConsumptionRecord
from app.models.incidents import NotificationType, IncidentSeverity
from app.services.leakage_detector import leakage_engine
from app.services.automation_service import AutomationService
from app.services.notification_service import NotificationService
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("simulator")

class IoTSimulator:
    def __init__(self):
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None
        self.active_anomaly_scenario: Optional[str] = None
        self.anomaly_target_pipeline_id: Optional[int] = None
        self.tick_counter: int = 0

    def start(self):
        if not self.is_running:
            self.is_running = True
            try:
                loop = asyncio.get_running_loop()
                self._task = loop.create_task(self._simulation_loop())
            except RuntimeError:
                # No running event loop in current thread (e.g. sync test runner)
                self._task = None
            logger.info("IoT Community Water Simulator started.")

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("IoT Community Water Simulator stopped.")

    def inject_scenario(self, scenario: str, pipeline_id: Optional[int] = None):
        self.active_anomaly_scenario = scenario
        self.anomaly_target_pipeline_id = pipeline_id
        logger.warning(f"Simulated anomaly injected: scenario='{scenario}', target_pipeline_id={pipeline_id}")

    def reset_scenarios(self):
        self.active_anomaly_scenario = None
        self.anomaly_target_pipeline_id = None
        logger.info("Simulation anomalies cleared. Reset to normal steady-state.")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await self.tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
            await asyncio.sleep(2.0)

    async def tick(self):
        self.tick_counter += 1
        db = SessionLocal()
        try:
            pipelines = db.query(Pipeline).all()
            tanks = db.query(WaterTank).all()
            households = db.query(Household).all()
            sensors = db.query(Sensor).all()

            if not pipelines or not tanks:
                return

            total_system_flow = 0.0
            sum_household_consumption = 0.0

            # 1. Update household micro-consumption
            for hh in households:
                # Random realistic draw (0 to 3.5 LPM per household)
                draw = random.choices([0.0, 1.2, 2.5, 4.0], weights=[0.6, 0.25, 0.12, 0.03])[0]
                sum_household_consumption += draw
                # Add to current day usage in DB every 5 ticks (~10 seconds)
                if self.tick_counter % 5 == 0 and draw > 0:
                    hh.current_day_usage_litres += round(draw * (10.0 / 60.0), 2)

            # 2. Update pipelines
            for p in pipelines:
                target_anomaly = (
                    self.active_anomaly_scenario is not None and
                    (self.anomaly_target_pipeline_id is None or self.anomaly_target_pipeline_id == p.id)
                )

                if p.is_isolated or p.valve_status == ValveStatus.CLOSED:
                    # Isolated or closed valve
                    p.current_flow_lpm = 0.0
                    p.current_pressure_bar = max(0.1, p.current_pressure_bar - 0.2)
                elif target_anomaly and self.active_anomaly_scenario == "pipe_burst":
                    # Severe catastrophic pipe burst
                    p.current_flow_lpm = round(p.normal_flow_lpm * random.uniform(1.8, 2.4), 1)
                    p.current_pressure_bar = round(random.uniform(0.9, 1.4), 2) # collapsed pressure!
                elif target_anomaly and self.active_anomaly_scenario == "micro_leak":
                    # Slow insidious crack
                    p.current_flow_lpm = round(p.normal_flow_lpm * 1.35, 1)
                    p.current_pressure_bar = round(p.nominal_pressure_bar * 0.92, 2)
                elif target_anomaly and self.active_anomaly_scenario == "pressure_drop":
                    # Drop in pressure
                    p.current_flow_lpm = round(p.normal_flow_lpm * 0.9, 1)
                    p.current_pressure_bar = round(random.uniform(1.2, 1.6), 2)
                else:
                    # Normal healthy hydraulic fluctuations
                    variation = random.uniform(-2.5, 2.5)
                    p.current_flow_lpm = max(0.0, round(p.normal_flow_lpm + variation, 1))
                    p.current_pressure_bar = round(p.nominal_pressure_bar + random.uniform(-0.15, 0.15), 2)

                p.updated_at = datetime.utcnow()
                total_system_flow += p.current_flow_lpm

                # Evaluate with Leakage Detection Engine
                downstream_sum = (sum_household_consumption / len(pipelines)) * 2.5
                incident = leakage_engine.evaluate_pipeline_telemetry(
                    db=db,
                    pipeline=p,
                    current_flow=p.current_flow_lpm,
                    current_pressure=p.current_pressure_bar,
                    sum_downstream_household_flow=downstream_sum
                )

                if incident and incident.severity == IncidentSeverity.CRITICAL:
                    # Run automation service to auto-isolate if permitted
                    AutomationService.handle_critical_incident(db, incident)

            # 3. Update Water Tanks
            for tank in tanks:
                if self.active_anomaly_scenario == "tank_drain" and tank.tank_type == TankType.OVERHEAD_TANK:
                    # Drain tank fast
                    tank.current_level_percentage = max(12.0, round(tank.current_level_percentage - 2.5, 1))
                    tank.current_level_litres = round(tank.capacity_litres * (tank.current_level_percentage / 100.0), 1)
                    if tank.current_level_percentage <= tank.low_level_threshold_pct and self.tick_counter % 10 == 0:
                        NotificationService.create_notification(
                            db=db,
                            title=f"Low Water Alert: {tank.name}",
                            message=f"Water level dropped to {tank.current_level_percentage}% (below {tank.low_level_threshold_pct}% threshold). Refill required.",
                            alert_type=NotificationType.LOW_TANK,
                            severity=IncidentSeverity.HIGH
                        )
                else:
                    # Slight fluctuations
                    delta = random.uniform(-0.1, 0.08)
                    new_pct = max(20.0, min(98.0, tank.current_level_percentage + delta))
                    tank.current_level_percentage = round(new_pct, 1)
                    tank.current_level_litres = round(tank.capacity_litres * (tank.current_level_percentage / 100.0), 1)
                
                tank.updated_at = datetime.utcnow()

            # 4. Periodic sensor reading history logging (every 10 ticks)
            if self.tick_counter % 10 == 0:
                for s in sensors[:8]: # log readings for primary flow & pressure sensors
                    f_val = None
                    p_val = None
                    t_val = None
                    if s.pipeline:
                        f_val = s.pipeline.current_flow_lpm
                        p_val = s.pipeline.current_pressure_bar
                    if s.tank:
                        t_val = s.tank.current_level_percentage

                    reading = SensorReading(
                        sensor_id=s.id,
                        timestamp=datetime.utcnow(),
                        flow_rate_lpm=f_val,
                        pressure_bar=p_val,
                        tank_level_percentage=t_val,
                        is_anomaly=(self.active_anomaly_scenario is not None),
                        anomaly_reason=self.active_anomaly_scenario
                    )
                    db.add(reading)

            db.commit()

            # 5. Broadcast real-time telemetry over WebSocket
            avg_pressure = sum(p.current_pressure_bar for p in pipelines) / max(1, len(pipelines))
            main_res = next((t for t in tanks if t.tank_type == TankType.MAIN_RESERVOIR), tanks[0])
            oh_tanks = [t for t in tanks if t.tank_type == TankType.OVERHEAD_TANK]
            avg_oh_pct = sum(t.current_level_percentage for t in oh_tanks) / max(1, len(oh_tanks)) if oh_tanks else 75.0

            telemetry_payload = {
                "type": "TELEMETRY_TICK",
                "data": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "total_system_flow_lpm": round(total_system_flow, 1),
                    "average_pressure_bar": round(avg_pressure, 2),
                    "main_reservoir_pct": main_res.current_level_percentage,
                    "main_reservoir_litres": main_res.current_level_litres,
                    "overhead_tanks_avg_pct": round(avg_oh_pct, 1),
                    "active_scenario": self.active_anomaly_scenario,
                    "pipelines": [{
                        "id": p.id,
                        "code": p.code,
                        "name": p.name,
                        "flow_lpm": p.current_flow_lpm,
                        "pressure_bar": p.current_pressure_bar,
                        "valve_status": p.valve_status.value,
                        "is_isolated": p.is_isolated
                    } for p in pipelines],
                    "tanks": [{
                        "id": t.id,
                        "name": t.name,
                        "type": t.tank_type.value,
                        "level_pct": t.current_level_percentage,
                        "level_litres": t.current_level_litres
                    } for t in tanks]
                }
            }
            await ws_manager.broadcast(telemetry_payload)

        finally:
            db.close()

simulator = IoTSimulator()
