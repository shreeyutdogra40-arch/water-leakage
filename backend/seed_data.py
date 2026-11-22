import logging
from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.community import Community, Building, Household
from app.models.infrastructure import (
    Pipeline, ValveStatus, Sensor, SensorType, WaterTank, TankType
)
from app.models.telemetry import SensorReading, ConsumptionRecord, WaterSupplyRecord
from app.models.incidents import (
    LeakageIncident, IncidentSeverity, IncidentStatus,
    Notification, NotificationType, MaintenanceRecord, MaintenanceStatus,
    ValveAction, ValveActionType
)
from app.services.auth_service import get_password_hash

logger = logging.getLogger("seed_data")

def seed_database(db: Session):
    # Ensure tables are created first
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).count() > 0:
        logger.info("Database already populated with seed data.")
        return

    logger.info("Seeding realistic Smart Water Monitoring dataset...")

    # 1. Community
    community = Community(
        name="GreenHeights Eco-Smart Community",
        location="Sector 42, Smart City Green Corridor",
        total_capacity_litres=140000.0,
        daily_budget_litres=24000.0
    )
    db.add(community)
    db.flush()

    # 2. Buildings
    tower_configs = [
        ("Lotus Tower (Block A)", "BLK-A", 6),
        ("Orchid Tower (Block B)", "BLK-B", 6),
        ("Magnolia Tower (Block C)", "BLK-C", 6),
        ("Jasmine Tower (Block D)", "BLK-D", 6),
    ]
    buildings = []
    for name, code, count in tower_configs:
        b = Building(
            community_id=community.id,
            name=name,
            block_code=code,
            total_households=count
        )
        db.add(b)
        buildings.append(b)
    db.flush()

    # 3. Households
    households = []
    names = [
        "Aarav Sharma", "Priya Nair", "Vikram Malhotra", "Ananya Rao", "Rohan Gupta", "Sneha Patel",
        "Karan Verma", "Meera Joshi", "Aditya Kulkarni", "Neha Sen", "Siddharth Das", "Pooja Reddy",
        "Deepak Iyer", "Tanvi Mehta", "Rajesh Kapoor", "Shreya Bhat", "Amitabh Saxena", "Nandini Ghosh",
        "Kunal Chopra", "Divya Menon", "Gaurav Singhania", "Ritu Agarwal", "Mohit Bansal", "Kavita Pillai"
    ]
    name_idx = 0
    for b in buildings:
        for floor in [1, 2]:
            for unit in [1, 2, 3]:
                unit_str = f"{b.block_code[-1]}-{floor}0{unit}"
                hh = Household(
                    building_id=b.id,
                    unit_number=unit_str,
                    resident_name=names[name_idx % len(names)],
                    contact_phone=f"+91 98765 {10000 + name_idx}",
                    meter_id=f"MTR-{b.block_code}-{floor}0{unit}",
                    daily_quota_litres=random.choice([550.0, 600.0, 650.0]),
                    current_day_usage_litres=round(random.uniform(180.0, 320.0), 1)
                )
                db.add(hh)
                households.append(hh)
                name_idx += 1
    db.flush()

    # 4. Users (3 Roles: Admin, Maintenance, Resident)
    users = [
        User(
            username="admin",
            email="admin@greenheights.smart",
            hashed_password=get_password_hash("admin123"),
            full_name="Shreeyut",
            role=UserRole.ADMIN,
            phone_number="+91 98111 00001",
            is_active=True
        ),
        User(
            username="technician",
            email="maintenance@greenheights.smart",
            hashed_password=get_password_hash("tech123"),
            full_name="Ramesh Kumar (Lead Hydraulic Tech)",
            role=UserRole.MAINTENANCE,
            phone_number="+91 98111 00002",
            is_active=True
        ),
        User(
            username="resident",
            email="resident@greenheights.smart",
            hashed_password=get_password_hash("resident123"),
            full_name="Aarav Sharma (Resident Apt A-101)",
            role=UserRole.RESIDENT,
            household_id=households[0].id,
            phone_number="+91 98765 10000",
            is_active=True
        ),
    ]
    for u in users:
        db.add(u)
    db.flush()

    # 5. Water Tanks
    tanks = [
        WaterTank(
            community_id=community.id,
            name="Main Underground Sump & Central Reservoir",
            tank_type=TankType.MAIN_RESERVOIR,
            capacity_litres=80000.0,
            current_level_litres=69200.0,
            current_level_percentage=86.5,
            height_meters=4.5,
            low_level_threshold_pct=25.0,
            is_filling=True
        ),
        WaterTank(
            community_id=community.id,
            building_id=buildings[0].id,
            name="Lotus Tower Overhead Tank (Block A)",
            tank_type=TankType.OVERHEAD_TANK,
            capacity_litres=15000.0,
            current_level_litres=12300.0,
            current_level_percentage=82.0,
            height_meters=3.2,
            low_level_threshold_pct=20.0,
            is_filling=False
        ),
        WaterTank(
            community_id=community.id,
            building_id=buildings[1].id,
            name="Orchid Tower Overhead Tank (Block B)",
            tank_type=TankType.OVERHEAD_TANK,
            capacity_litres=15000.0,
            current_level_litres=11700.0,
            current_level_percentage=78.0,
            height_meters=3.2,
            low_level_threshold_pct=20.0,
            is_filling=False
        ),
        WaterTank(
            community_id=community.id,
            building_id=buildings[2].id,
            name="Magnolia Tower Overhead Tank (Block C)",
            tank_type=TankType.OVERHEAD_TANK,
            capacity_litres=15000.0,
            current_level_litres=10650.0,
            current_level_percentage=71.0,
            height_meters=3.2,
            low_level_threshold_pct=20.0,
            is_filling=False
        ),
        WaterTank(
            community_id=community.id,
            building_id=buildings[3].id,
            name="Jasmine Tower Overhead Tank (Block D)",
            tank_type=TankType.OVERHEAD_TANK,
            capacity_litres=15000.0,
            current_level_litres=13500.0,
            current_level_percentage=90.0,
            height_meters=3.2,
            low_level_threshold_pct=20.0,
            is_filling=False
        ),
    ]
    for t in tanks:
        db.add(t)
    db.flush()

    # 6. Pipelines & Valves
    pipelines = [
        Pipeline(
            community_id=community.id,
            name="Main Reservoir Distribution Trunk",
            code="TRUNK-MAIN-01",
            material="DI (Ductile Iron) Class K9",
            diameter_mm=100.0,
            max_pressure_bar=8.0,
            nominal_pressure_bar=4.2,
            normal_flow_lpm=140.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=138.5,
            current_pressure_bar=4.15
        ),
        Pipeline(
            community_id=community.id,
            name="Secondary Distribution Manifold",
            code="TRUNK-SUB-02",
            material="HDPE PN16",
            diameter_mm=75.0,
            max_pressure_bar=6.0,
            nominal_pressure_bar=3.8,
            normal_flow_lpm=110.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=108.0,
            current_pressure_bar=3.75
        ),
        Pipeline(
            community_id=community.id,
            building_id=buildings[0].id,
            name="Lotus Tower Riser Line (Block A)",
            code="PIPE-TWR-A",
            material="CPVC Schedule 80",
            diameter_mm=50.0,
            max_pressure_bar=5.0,
            nominal_pressure_bar=3.4,
            normal_flow_lpm=32.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=31.5,
            current_pressure_bar=3.38
        ),
        Pipeline(
            community_id=community.id,
            building_id=buildings[1].id,
            name="Orchid Tower Riser Line (Block B)",
            code="PIPE-TWR-B",
            material="CPVC Schedule 80",
            diameter_mm=50.0,
            max_pressure_bar=5.0,
            nominal_pressure_bar=3.4,
            normal_flow_lpm=34.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=33.2,
            current_pressure_bar=3.41
        ),
        Pipeline(
            community_id=community.id,
            building_id=buildings[2].id,
            name="Magnolia Tower Riser Line (Block C)",
            code="PIPE-TWR-C",
            material="CPVC Schedule 80",
            diameter_mm=50.0,
            max_pressure_bar=5.0,
            nominal_pressure_bar=3.4,
            normal_flow_lpm=30.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=30.4,
            current_pressure_bar=3.35
        ),
        Pipeline(
            community_id=community.id,
            building_id=buildings[3].id,
            name="Jasmine Tower Riser Line (Block D)",
            code="PIPE-TWR-D",
            material="CPVC Schedule 80",
            diameter_mm=50.0,
            max_pressure_bar=5.0,
            nominal_pressure_bar=3.4,
            normal_flow_lpm=33.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=32.8,
            current_pressure_bar=3.40
        ),
        Pipeline(
            community_id=community.id,
            name="Community Irrigation & Landscaping Loop",
            code="PIPE-IRRIG-01",
            material="LLDPE Dripline / PVC",
            diameter_mm=32.0,
            max_pressure_bar=4.0,
            nominal_pressure_bar=2.5,
            normal_flow_lpm=18.0,
            valve_status=ValveStatus.OPEN,
            is_isolated=False,
            current_flow_lpm=17.5,
            current_pressure_bar=2.48
        ),
    ]
    for p in pipelines:
        db.add(p)
    db.flush()

    # 7. Sensors
    sensors = [
        Sensor(
            pipeline_id=pipelines[0].id,
            sensor_code="SNS-FLOW-MAIN-01",
            name="Main Trunk Electromagnetic Flow Transmitter",
            sensor_type=SensorType.FLOW,
            hardware_model="ESP32 + Modbus Ultrasonic Flow",
            is_online=True,
            battery_level=98.0,
            calibration_factor=7.5
        ),
        Sensor(
            pipeline_id=pipelines[0].id,
            sensor_code="SNS-PRES-MAIN-01",
            name="Main Trunk Piezoresistive Pressure Sensor",
            sensor_type=SensorType.PRESSURE,
            hardware_model="ESP32 + 4-20mA Pressure Transducer",
            is_online=True,
            battery_level=95.0,
            calibration_factor=1.0
        ),
        Sensor(
            tank_id=tanks[0].id,
            sensor_code="SNS-LVL-SUMP-01",
            name="Central Reservoir Hydrostatic Level Gauge",
            sensor_type=SensorType.ULTRASONIC_LEVEL,
            hardware_model="ESP32 + Waterproof HC-SR04 / JSN-SR04T",
            is_online=True,
            battery_level=100.0,
            calibration_factor=0.0343
        ),
        Sensor(
            pipeline_id=pipelines[2].id,
            sensor_code="SNS-FLOW-TWRA-01",
            name="Tower A Pulse Flow Sensor",
            sensor_type=SensorType.FLOW,
            hardware_model="ESP32 + YF-S201 Hall Flow",
            is_online=True,
            battery_level=92.0,
            calibration_factor=7.5
        ),
        Sensor(
            pipeline_id=pipelines[2].id,
            sensor_code="SNS-PRES-TWRA-01",
            name="Tower A Pressure Sensor",
            sensor_type=SensorType.PRESSURE,
            hardware_model="ESP32 + 5V Ceramic Pressure Transducer",
            is_online=True,
            battery_level=91.0,
            calibration_factor=1.0
        ),
        Sensor(
            pipeline_id=pipelines[3].id,
            sensor_code="SNS-FLOW-TWRB-01",
            name="Tower B Pulse Flow Sensor",
            sensor_type=SensorType.FLOW,
            hardware_model="ESP32 + YF-S201 Hall Flow",
            is_online=True,
            battery_level=94.0,
            calibration_factor=7.5
        ),
        Sensor(
            pipeline_id=pipelines[4].id,
            sensor_code="SNS-FLOW-TWRC-01",
            name="Tower C Pulse Flow Sensor",
            sensor_type=SensorType.FLOW,
            hardware_model="ESP32 + YF-S201 Hall Flow",
            is_online=True,
            battery_level=88.0,
            calibration_factor=7.5
        ),
        Sensor(
            pipeline_id=pipelines[5].id,
            sensor_code="SNS-FLOW-TWRD-01",
            name="Tower D Pulse Flow Sensor",
            sensor_type=SensorType.FLOW,
            hardware_model="ESP32 + YF-S201 Hall Flow",
            is_online=True,
            battery_level=96.0,
            calibration_factor=7.5
        ),
        Sensor(
            tank_id=tanks[1].id,
            sensor_code="SNS-LVL-ROOF-A",
            name="Tower A Rooftop Ultrasonic Depth Sensor",
            sensor_type=SensorType.ULTRASONIC_LEVEL,
            hardware_model="ESP32 + JSN-SR04T",
            is_online=True,
            battery_level=89.0,
            calibration_factor=0.0343
        ),
    ]
    for s in sensors:
        db.add(s)
    db.flush()

    # 8. Seed 30 days of historical daily consumption & supply
    start_date = date.today() - timedelta(days=30)
    for i in range(30):
        cur_date = start_date + timedelta(days=i)
        
        # Buildings consumption
        for b in buildings:
            # 6 households in building, ~2800-3400 L/day
            b_consumed = round(random.uniform(2700.0, 3350.0), 1)
            b_rec = ConsumptionRecord(
                building_id=b.id,
                record_date=cur_date,
                volume_consumed_litres=b_consumed,
                peak_flow_rate=round(random.uniform(34.0, 42.0), 1),
                abnormal_consumption_detected=False
            )
            db.add(b_rec)

        # Community water supply record
        day_supplied = round(random.uniform(12500.0, 14200.0), 1)
        supply_rec = WaterSupplyRecord(
            community_id=community.id,
            tank_id=tanks[0].id,
            supply_source="Municipal Water Supply Grid",
            volume_supplied_litres=day_supplied,
            supply_start=datetime.combine(cur_date, datetime.min.time()) + timedelta(hours=5),
            supply_end=datetime.combine(cur_date, datetime.min.time()) + timedelta(hours=9),
            cost_estimate=round(day_supplied * 0.003, 2),
            created_at=datetime.combine(cur_date, datetime.min.time())
        )
        db.add(supply_rec)

    # 9. Initial Leakage Incidents
    past_resolved = LeakageIncident(
        pipeline_id=pipelines[3].id,
        building_id=buildings[1].id,
        detected_at=datetime.utcnow() - timedelta(days=2, hours=4),
        severity=IncidentSeverity.HIGH,
        flow_rate=54.2,
        pressure_reading=2.15,
        confidence_score=0.91,
        detection_reason="Pressure drop of 1.25 bar coupled with 59% elevated branch flow",
        status=IncidentStatus.RESOLVED,
        assigned_to_user_id=users[1].id,
        resolved_at=datetime.utcnow() - timedelta(days=1, hours=22),
        notes="Replaced faulty PVC joint on Block B 2nd floor shaft. Tested under 4 bar pressure.",
        estimated_water_lost_litres=420.0
    )
    db.add(past_resolved)
    db.flush()

    maint = MaintenanceRecord(
        incident_id=past_resolved.id,
        pipeline_id=past_resolved.pipeline_id,
        technician_user_id=users[1].id,
        status=MaintenanceStatus.COMPLETED,
        work_description="Repaired fractured slip-joint on 50mm riser. Re-pressurized line and verified zero pressure loss.",
        parts_replaced="50mm CPVC coupling, heavy-duty solvent cement, rubber gasket",
        cost=85.0,
        started_at=datetime.utcnow() - timedelta(days=2, hours=1),
        completed_at=datetime.utcnow() - timedelta(days=1, hours=22)
    )
    db.add(maint)

    # Incident 2: Active Critical Burst on Secondary Manifold (Auto-isolated)
    burst_inc = LeakageIncident(
        pipeline_id=pipelines[1].id,
        building_id=None,
        detected_at=datetime.utcnow() - timedelta(hours=1, minutes=20),
        severity=IncidentSeverity.CRITICAL,
        flow_rate=158.4,
        pressure_reading=1.35,
        confidence_score=0.97,
        detection_reason="Pipe Burst Alert: Hydraulic pressure collapse to 1.35 Bar with sudden 158.4 LPM surge. Sub-manifold auto-isolated.",
        status=IncidentStatus.ASSIGNED,
        assigned_to_user_id=users[1].id,
        estimated_water_lost_litres=680.0,
        notes="Technician dispatched with ultrasonic leak detector and acoustic listening stick. Branch valve TRUNK-SUB-02 isolated."
    )
    db.add(burst_inc)

    # Incident 3: Active High incident on Magnolia Tower (Block C)
    tower_c_inc = LeakageIncident(
        pipeline_id=pipelines[4].id,
        building_id=buildings[2].id,
        detected_at=datetime.utcnow() - timedelta(hours=3, minutes=15),
        severity=IncidentSeverity.HIGH,
        flow_rate=52.6,
        pressure_reading=2.15,
        confidence_score=0.93,
        detection_reason="Abnormal continuous flow of 52.6 LPM detected with 1.25 Bar pressure drop across shaft riser",
        status=IncidentStatus.DETECTED,
        estimated_water_lost_litres=340.0,
        notes="Alarm triggered by Rule 1 (Pressure Drop) and Rule 3 (Persistence). Awaiting technician inspection."
    )
    db.add(tower_c_inc)

    # Incident 4: Medium Micro-fissure discrepancy on Lotus Tower (Block A)
    micro_inc = LeakageIncident(
        pipeline_id=pipelines[2].id,
        building_id=buildings[0].id,
        household_id=households[4].id,
        detected_at=datetime.utcnow() - timedelta(hours=5, minutes=45),
        severity=IncidentSeverity.MEDIUM,
        flow_rate=16.5,
        pressure_reading=3.12,
        confidence_score=0.88,
        detection_reason="Mass-Balance Discrepancy: 18.2% unaccounted water flow between floor riser meter and sub-meters",
        status=IncidentStatus.ACKNOWLEDGED,
        assigned_to_user_id=users[1].id,
        estimated_water_lost_litres=145.0,
        notes="Suspected hairline fissure near Apt A-202 connection manifold."
    )
    db.add(micro_inc)

    # Incident 5: Low severity off-hours flow on Irrigation Loop
    night_inc = LeakageIncident(
        pipeline_id=pipelines[6].id,
        building_id=None,
        detected_at=datetime.utcnow() - timedelta(hours=8, minutes=10),
        severity=IncidentSeverity.LOW,
        flow_rate=22.4,
        pressure_reading=2.10,
        confidence_score=0.82,
        detection_reason="Continuous flow during scheduled non-irrigation window (02:30 - 04:15 UTC)",
        status=IncidentStatus.ACKNOWLEDGED,
        estimated_water_lost_litres=210.0,
        notes="Groundskeeping solenoid sticking open. Scheduled for O-ring gasket service."
    )
    db.add(night_inc)

    # Incident 6: ML Anomaly on Jasmine Tower (Block D) - Resolved
    ml_inc = LeakageIncident(
        pipeline_id=pipelines[5].id,
        building_id=buildings[3].id,
        household_id=households[19].id,
        detected_at=datetime.utcnow() - timedelta(days=1, hours=8),
        severity=IncidentSeverity.MEDIUM,
        flow_rate=34.0,
        pressure_reading=3.20,
        confidence_score=0.89,
        detection_reason="ML Isolation Forest Anomaly: Hourly diurnal consumption vector diverged from baseline by 3.8 sigma",
        status=IncidentStatus.RESOLVED,
        assigned_to_user_id=users[1].id,
        resolved_at=datetime.utcnow() - timedelta(hours=14),
        estimated_water_lost_litres=280.0,
        notes="Cistern inlet valve replaced in Apartment D-102. Verified normal night curve returned."
    )
    db.add(ml_inc)
    db.flush()

    maint2 = MaintenanceRecord(
        incident_id=ml_inc.id,
        pipeline_id=ml_inc.pipeline_id,
        technician_user_id=users[1].id,
        status=MaintenanceStatus.COMPLETED,
        work_description="Inspected Apt D-102 plumbing. Replaced worn diaphragm seal in toilet fill valve.",
        parts_replaced="Fluidmaster 400A universal fill valve seal",
        cost=45.0,
        started_at=datetime.utcnow() - timedelta(hours=18),
        completed_at=datetime.utcnow() - timedelta(hours=14)
    )
    db.add(maint2)

    # 10. Notifications
    notifs = [
        Notification(
            user_id=None,
            incident_id=burst_inc.id,
            title="CRITICAL: Pipe Burst on Secondary Manifold",
            message="Pressure collapsed to 1.35 Bar with sudden 158.4 LPM surge. Automatic valve shutoff executed on TRUNK-SUB-02.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.CRITICAL,
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=19)
        ),
        Notification(
            user_id=None,
            incident_id=tower_c_inc.id,
            title="HIGH ALERT: Pressure Drop on Magnolia Tower (Block C)",
            message="Continuous elevated flow of 52.6 LPM with 1.25 Bar pressure drop detected on PIPE-TWRC.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.HIGH,
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=3, minutes=14)
        ),
        Notification(
            user_id=None,
            incident_id=micro_inc.id,
            title="Warning: Discrepancy on Lotus Tower (Block A)",
            message="Mass-balance discrepancy of 18.2% unaccounted water flow detected near Apt A-202 manifold.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.MEDIUM,
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=5, minutes=44)
        ),
        Notification(
            user_id=None,
            incident_id=night_inc.id,
            title="Advisory: Off-Hours Flow on Irrigation Loop",
            message="Continuous flow of 22.4 LPM detected during non-scheduled irrigation window.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.LOW,
            is_read=True,
            created_at=datetime.utcnow() - timedelta(hours=8, minutes=9)
        ),
        Notification(
            user_id=None,
            title="Municipal Water Supply Inflow Complete",
            message="Central reservoir replenished with 13,800 Litres. Storage level at 86.5%.",
            alert_type=NotificationType.SYSTEM_INFO,
            severity=IncidentSeverity.LOW,
            is_read=True,
            created_at=datetime.utcnow() - timedelta(hours=10)
        ),
        Notification(
            user_id=None,
            incident_id=ml_inc.id,
            title="Work Order Completed: Jasmine Tower",
            message="ML anomaly incident resolved. Apartment D-102 fill valve replaced.",
            alert_type=NotificationType.LEAKAGE,
            severity=IncidentSeverity.LOW,
            is_read=True,
            created_at=datetime.utcnow() - timedelta(hours=14)
        )
    ]
    for n in notifs:
        db.add(n)

    db.commit()
    logger.info("Database seeding successfully completed!")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
