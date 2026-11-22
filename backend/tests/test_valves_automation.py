from sqlalchemy.orm import Session
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.incidents import LeakageIncident, IncidentSeverity, ValveAction, ValveActionType
from app.services.automation_service import AutomationService

def test_auto_isolation_on_branch_pipeline(db: Session):
    branch_pipeline = db.query(Pipeline).filter(Pipeline.code == "PIPE-TWR-A").first()
    branch_pipeline.valve_status = ValveStatus.OPEN
    branch_pipeline.is_isolated = False
    db.commit()

    incident = LeakageIncident(
        pipeline_id=branch_pipeline.id,
        building_id=branch_pipeline.building_id,
        severity=IncidentSeverity.CRITICAL,
        flow_rate=80.0,
        pressure_reading=1.0,
        confidence_score=0.98,
        detection_reason="Catastrophic pipe burst test",
        estimated_water_lost_litres=500.0
    )
    db.add(incident)
    db.commit()

    isolated = AutomationService.handle_critical_incident(db, incident)
    assert isolated is True

    db.refresh(branch_pipeline)
    assert branch_pipeline.valve_status == ValveStatus.CLOSED
    assert branch_pipeline.is_isolated is True

    # Verify action logged
    action = db.query(ValveAction).filter(ValveAction.pipeline_id == branch_pipeline.id).order_by(ValveAction.id.desc()).first()
    assert action is not None
    assert action.action_type == ValveActionType.AUTO_ISOLATION

def test_safety_guard_protects_main_line(db: Session):
    main_pipeline = db.query(Pipeline).filter(Pipeline.code == "TRUNK-MAIN-01").first()
    main_pipeline.valve_status = ValveStatus.OPEN
    main_pipeline.is_isolated = False
    db.commit()

    critical_main_incident = LeakageIncident(
        pipeline_id=main_pipeline.id,
        building_id=None,
        severity=IncidentSeverity.CRITICAL,
        flow_rate=220.0,
        pressure_reading=1.5,
        confidence_score=0.99,
        detection_reason="Critical leak on main supply header",
        estimated_water_lost_litres=1200.0
    )
    db.add(critical_main_incident)
    db.commit()

    # Safety policy must prevent automatic isolation of main community line
    isolated = AutomationService.handle_critical_incident(db, critical_main_incident)
    assert isolated is False

    db.refresh(main_pipeline)
    assert main_pipeline.valve_status == ValveStatus.OPEN
    assert main_pipeline.is_isolated is False
