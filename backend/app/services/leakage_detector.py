from typing import Dict, List, Optional, Tuple
from datetime import datetime
import numpy as np
import logging
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.config import settings
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.incidents import (
    LeakageIncident, IncidentSeverity, IncidentStatus, NotificationType
)
from app.models.community import Building, Household
from app.models.telemetry import ConsumptionRecord
from app.services.notification_service import NotificationService

logger = logging.getLogger("leakage_detector")

class LeakageDetectionEngine:
    def __init__(self):
        # In-memory persistence tracker: {pipeline_id: [list of recent anomaly flags and values]}
        self.anomaly_buffers: Dict[int, List[Dict]] = {}
        # Simple trained Isolation Forest model for consumption vectors
        self.ml_model = IsolationForest(contamination=0.08, random_state=42)
        self._init_ml_baseline()

    def _init_ml_baseline(self):
        """Train a lightweight baseline Isolation Forest on typical diurnal residential hourly flow profiles."""
        np.random.seed(42)
        # 200 samples of normal hourly water consumption (litres per hour across 24h)
        # Normal profile: low at night (1-4), peaks morning (7-9) and evening (19-21)
        base_curve = np.array([
            2.0, 1.5, 1.0, 1.0, 3.0, 8.0, 25.0, 35.0, 28.0, 15.0,
            12.0, 14.0, 16.0, 14.0, 12.0, 11.0, 15.0, 22.0, 32.0, 30.0,
            24.0, 16.0, 8.0, 4.0
        ])
        normal_samples = np.array([
            base_curve * np.random.uniform(0.8, 1.25, size=24) + np.random.normal(0, 0.5, size=24)
            for _ in range(250)
        ])
        normal_samples = np.clip(normal_samples, 0.0, None)
        self.ml_model.fit(normal_samples)
        logger.info("Baseline Isolation Forest trained on 250 diurnal usage curves.")

    def score_hourly_consumption_anomaly(self, hourly_usage: List[float]) -> Tuple[bool, float]:
        """
        Takes 24 hours of flow/consumption and returns (is_anomaly, anomaly_score).
        IsolationForest decision_function: lower score = more anomalous.
        """
        if len(hourly_usage) != 24:
            # Pad or slice to 24
            hourly_usage = (hourly_usage * 2)[:24]
        X = np.array([hourly_usage])
        pred = self.ml_model.predict(X)[0] # -1 = anomaly, 1 = normal
        score = float(self.ml_model.decision_function(X)[0])
        is_anomaly = bool(pred == -1)
        # Convert decision function score to confidence 0.0 - 1.0
        confidence = float(np.clip(1.0 - (score + 0.25), 0.5, 0.99))
        return is_anomaly, confidence

    def evaluate_pipeline_telemetry(
        self,
        db: Session,
        pipeline: Pipeline,
        current_flow: float,
        current_pressure: float,
        sum_downstream_household_flow: Optional[float] = None
    ) -> Optional[LeakageIncident]:
        """
        Multi-parameter evaluation:
        1. Pressure drop vs nominal (< nominal - 0.85 bar)
        2. Mass-balance flow discrepancy (inflow vs downstream sum > 12%)
        3. Night-time / zero-expected flow continuous run (> 8 LPM during off-hours)
        4. Burst flow (flow exceeds normal max by > 50% with pressure collapsing)
        5. Temporal persistence checking to eliminate transient noise
        """
        # If pipeline valve is closed or isolated, skip unless flow is still detected!
        if pipeline.valve_status == ValveStatus.CLOSED and current_flow > 2.0:
            # Valve closed but flow detected! Passing valve or illegal bypass
            reason = f"Flow of {current_flow:.1f} LPM detected while valve is CLOSED."
            return self._record_candidate(
                db, pipeline, current_flow, current_pressure,
                severity=IncidentSeverity.HIGH,
                confidence=0.92,
                reason=reason
            )

        if pipeline.is_isolated:
            return None

        anomaly_detected = False
        anomaly_reason = ""
        candidate_severity = IncidentSeverity.LOW
        confidence = 0.70

        # Condition 1: Pipe Burst (Catastrophic pressure drop + surging flow)
        nominal_p = pipeline.nominal_pressure_bar
        pressure_drop = nominal_p - current_pressure
        if pressure_drop >= settings.PRESSURE_DROP_THRESHOLD_BAR and current_flow >= pipeline.normal_flow_lpm * 1.3:
            anomaly_detected = True
            candidate_severity = IncidentSeverity.CRITICAL
            confidence = 0.96
            anomaly_reason = (
                f"Pipe Burst Detected: Pressure dropped by {pressure_drop:.2f} bar "
                f"({current_pressure:.2f} bar vs nominal {nominal_p:.2f} bar) with surging flow of {current_flow:.1f} LPM"
            )

        # Condition 2: Significant Pressure Drop with normal or high flow
        elif pressure_drop >= settings.PRESSURE_DROP_THRESHOLD_BAR and current_flow > 5.0:
            anomaly_detected = True
            candidate_severity = IncidentSeverity.HIGH
            confidence = 0.88
            anomaly_reason = (
                f"Abnormal Pressure Drop: Pipeline pressure fell to {current_pressure:.2f} bar "
                f"(drop of {pressure_drop:.2f} bar) under active transmission"
            )

        # Condition 3: Mass Balance Flow Discrepancy (Bulk line inflow vs downstream household meters)
        elif sum_downstream_household_flow is not None and current_flow > 10.0:
            unaccounted_flow = current_flow - sum_downstream_household_flow
            discrepancy_pct = (unaccounted_flow / current_flow) * 100.0
            if discrepancy_pct > settings.FLOW_DISCREPANCY_PCT and unaccounted_flow > 4.0:
                anomaly_detected = True
                confidence = min(0.95, 0.75 + (discrepancy_pct / 100.0) * 0.2)
                candidate_severity = IncidentSeverity.HIGH if discrepancy_pct > 25.0 else IncidentSeverity.MEDIUM
                anomaly_reason = (
                    f"Mass-Balance Discrepancy: {discrepancy_pct:.1f}% unaccounted water flow "
                    f"({unaccounted_flow:.1f} LPM lost between main meter {current_flow:.1f} LPM and sub-meters {sum_downstream_household_flow:.1f} LPM)"
                )

        # Condition 4: Night-time abnormal continuous flow
        else:
            current_hour = datetime.utcnow().hour
            if settings.NIGHT_HOURS_START <= current_hour <= settings.NIGHT_HOURS_END:
                if current_flow > settings.NIGHT_MAX_FLOW_THRESHOLD_LPM:
                    anomaly_detected = True
                    candidate_severity = IncidentSeverity.MEDIUM
                    confidence = 0.82
                    anomaly_reason = (
                        f"Abnormal Night-time Continuous Flow: {current_flow:.1f} LPM measured "
                        f"during zero-expected demand window (01:00-05:00 UTC)"
                    )

        # Persistence check
        if pipeline.id not in self.anomaly_buffers:
            self.anomaly_buffers[pipeline.id] = []

        buffer = self.anomaly_buffers[pipeline.id]

        if anomaly_detected:
            buffer.append({
                "time": datetime.utcnow(),
                "flow": current_flow,
                "pressure": current_pressure,
                "severity": candidate_severity,
                "confidence": confidence,
                "reason": anomaly_reason
            })
            # Keep only the last 10 ticks
            if len(buffer) > 10:
                buffer.pop(0)

            # Check if condition persisted for at least PERSISTENCE_MIN_TICKS
            if len(buffer) >= settings.PERSISTENCE_MIN_TICKS:
                return self._record_candidate(
                    db, pipeline, current_flow, current_pressure,
                    severity=candidate_severity,
                    confidence=confidence,
                    reason=anomaly_reason
                )
        else:
            # Decay buffer on normal reading
            if buffer:
                buffer.pop(0)

        return None

    def _record_candidate(
        self,
        db: Session,
        pipeline: Pipeline,
        current_flow: float,
        current_pressure: float,
        severity: IncidentSeverity,
        confidence: float,
        reason: str
    ) -> Optional[LeakageIncident]:
        # Check if there is already an active (non-resolved, non-closed) incident for this pipeline
        existing = db.query(LeakageIncident).filter(
            LeakageIncident.pipeline_id == pipeline.id,
            LeakageIncident.status.in_([IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.ASSIGNED])
        ).first()

        if existing:
            # Update flow and pressure readings
            existing.flow_rate = current_flow
            existing.pressure_reading = current_pressure
            # If newly evaluated severity is higher (e.g. escalated from medium to critical), escalate it
            if severity == IncidentSeverity.CRITICAL and existing.severity != IncidentSeverity.CRITICAL:
                existing.severity = IncidentSeverity.CRITICAL
                existing.detection_reason = reason
            db.commit()
            return existing

        # Create new incident
        incident = LeakageIncident(
            pipeline_id=pipeline.id,
            building_id=pipeline.building_id,
            detected_at=datetime.utcnow(),
            severity=severity,
            flow_rate=current_flow,
            pressure_reading=current_pressure,
            confidence_score=confidence,
            detection_reason=reason,
            status=IncidentStatus.DETECTED,
            estimated_water_lost_litres=round(current_flow * 5.0, 1),
            created_at=datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # Create alert notification
        NotificationService.create_notification(
            db=db,
            title=f"Leakage Detected on {pipeline.name}",
            message=f"[{severity.value.upper()}] {reason}. Current Flow: {current_flow:.1f} LPM, Pressure: {current_pressure:.2f} bar.",
            alert_type=NotificationType.LEAKAGE,
            severity=severity,
            incident_id=incident.id
        )

        return incident

leakage_engine = LeakageDetectionEngine()
