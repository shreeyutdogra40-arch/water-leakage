using System;
using System.Collections.Generic;
using System.Linq;
using AquaFlow.Server.Models;
using BCrypt.Net;

namespace AquaFlow.Server.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any())
            {
                return; // Database already seeded
            }

            // 1. Community
            var community = new Community
            {
                Name = "GreenHeights Eco-Smart Community",
                Location = "Sector 42, Smart City Green Corridor",
                TotalCapacityLitres = 140000.0,
                DailyBudgetLitres = 24000.0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Communities.Add(community);
            context.SaveChanges();

            // 2. Buildings
            var buildings = new List<Building>
            {
                new Building { CommunityId = community.Id, Name = "Lotus Tower (Block A)", BlockCode = "BLK-A", TotalHouseholds = 6 },
                new Building { CommunityId = community.Id, Name = "Orchid Tower (Block B)", BlockCode = "BLK-B", TotalHouseholds = 6 },
                new Building { CommunityId = community.Id, Name = "Magnolia Tower (Block C)", BlockCode = "BLK-C", TotalHouseholds = 6 },
                new Building { CommunityId = community.Id, Name = "Jasmine Tower (Block D)", BlockCode = "BLK-D", TotalHouseholds = 6 },
            };
            context.Buildings.AddRange(buildings);
            context.SaveChanges();

            // 3. Households
            var households = new List<Household>();
            var names = new[]
            {
                "Aarav Sharma", "Priya Nair", "Vikram Malhotra", "Ananya Rao", "Rohan Gupta", "Sneha Patel",
                "Karan Verma", "Meera Joshi", "Aditya Kulkarni", "Neha Sen", "Siddharth Das", "Pooja Reddy",
                "Deepak Iyer", "Tanvi Mehta", "Rajesh Kapoor", "Shreya Bhat", "Amitabh Saxena", "Nandini Ghosh",
                "Kunal Chopra", "Divya Menon", "Gaurav Singhania", "Ritu Agarwal", "Mohit Bansal", "Kavita Pillai"
            };
            int nameIdx = 0;
            var rand = new Random(42);

            foreach (var b in buildings)
            {
                for (int floor = 1; floor <= 2; floor++)
                {
                    for (int unit = 1; unit <= 3; unit++)
                    {
                        var hh = new Household
                        {
                            BuildingId = b.Id,
                            UnitNumber = $"{b.BlockCode[^1]}-{floor}0{unit}",
                            ResidentName = names[nameIdx % names.Length],
                            ContactPhone = $"+91 98765 {10000 + nameIdx}",
                            MeterId = $"MTR-{b.BlockCode}-{floor}0{unit}",
                            DailyQuotaLitres = (floor == 1) ? 600.0 : 650.0,
                            CurrentDayUsageLitres = Math.Round(210.0 + rand.NextDouble() * 90.0, 1)
                        };
                        households.Add(hh);
                        nameIdx++;
                    }
                }
            }
            context.Households.AddRange(households);
            context.SaveChanges();

            // 4. Users (Admin Shreeyut, Technician, Resident)
            var users = new List<User>
            {
                new User
                {
                    Username = "admin",
                    Email = "admin@greenheights.smart",
                    HashedPassword = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    FullName = "Shreeyut",
                    Role = UserRole.Admin,
                    PhoneNumber = "+91 98111 00001",
                    IsActive = true
                },
                new User
                {
                    Username = "technician",
                    Email = "maintenance@greenheights.smart",
                    HashedPassword = BCrypt.Net.BCrypt.HashPassword("tech123"),
                    FullName = "Ramesh Kumar (Lead Hydraulic Tech)",
                    Role = UserRole.Maintenance,
                    PhoneNumber = "+91 98111 00002",
                    IsActive = true
                },
                new User
                {
                    Username = "resident",
                    Email = "resident@greenheights.smart",
                    HashedPassword = BCrypt.Net.BCrypt.HashPassword("resident123"),
                    FullName = "Aarav Sharma (Resident Apt A-101)",
                    Role = UserRole.Resident,
                    HouseholdId = households[0].Id,
                    PhoneNumber = "+91 98765 10000",
                    IsActive = true
                }
            };
            context.Users.AddRange(users);
            context.SaveChanges();

            // 5. Water Tanks
            var tanks = new List<WaterTank>
            {
                new WaterTank
                {
                    CommunityId = community.Id,
                    Name = "Main Underground Sump & Central Reservoir",
                    TankType = TankType.MainReservoir,
                    CapacityLitres = 80000.0,
                    CurrentLevelLitres = 69200.0,
                    CurrentLevelPercentage = 86.5,
                    HeightMeters = 4.5,
                    LowLevelThresholdPct = 25.0,
                    IsFilling = true
                },
                new WaterTank
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[0].Id,
                    Name = "Lotus Tower Overhead Tank (Block A)",
                    TankType = TankType.OverheadTank,
                    CapacityLitres = 15000.0,
                    CurrentLevelLitres = 12300.0,
                    CurrentLevelPercentage = 82.0,
                    HeightMeters = 3.2,
                    LowLevelThresholdPct = 20.0,
                    IsFilling = false
                },
                new WaterTank
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[1].Id,
                    Name = "Orchid Tower Overhead Tank (Block B)",
                    TankType = TankType.OverheadTank,
                    CapacityLitres = 15000.0,
                    CurrentLevelLitres = 11700.0,
                    CurrentLevelPercentage = 78.0,
                    HeightMeters = 3.2,
                    LowLevelThresholdPct = 20.0,
                    IsFilling = false
                },
                new WaterTank
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[2].Id,
                    Name = "Magnolia Tower Overhead Tank (Block C)",
                    TankType = TankType.OverheadTank,
                    CapacityLitres = 15000.0,
                    CurrentLevelLitres = 10650.0,
                    CurrentLevelPercentage = 71.0,
                    HeightMeters = 3.2,
                    LowLevelThresholdPct = 20.0,
                    IsFilling = false
                },
                new WaterTank
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[3].Id,
                    Name = "Jasmine Tower Overhead Tank (Block D)",
                    TankType = TankType.OverheadTank,
                    CapacityLitres = 15000.0,
                    CurrentLevelLitres = 13500.0,
                    CurrentLevelPercentage = 90.0,
                    HeightMeters = 3.2,
                    LowLevelThresholdPct = 20.0,
                    IsFilling = false
                }
            };
            context.WaterTanks.AddRange(tanks);
            context.SaveChanges();

            // 6. Pipelines
            var pipelines = new List<Pipeline>
            {
                new Pipeline
                {
                    CommunityId = community.Id,
                    Name = "Main Reservoir Distribution Trunk",
                    Code = "TRUNK-MAIN-01",
                    Material = "DI (Ductile Iron) Class K9",
                    DiameterMm = 100.0,
                    MaxPressureBar = 8.0,
                    NominalPressureBar = 4.2,
                    NormalFlowLpm = 140.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 138.5,
                    CurrentPressureBar = 4.15
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    Name = "Secondary Distribution Manifold",
                    Code = "TRUNK-SUB-02",
                    Material = "HDPE PN16",
                    DiameterMm = 75.0,
                    MaxPressureBar = 6.0,
                    NominalPressureBar = 3.8,
                    NormalFlowLpm = 110.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 108.0,
                    CurrentPressureBar = 3.75
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[0].Id,
                    Name = "Lotus Tower Riser Line (Block A)",
                    Code = "PIPE-TWR-A",
                    Material = "CPVC Schedule 80",
                    DiameterMm = 50.0,
                    MaxPressureBar = 5.0,
                    NominalPressureBar = 3.4,
                    NormalFlowLpm = 32.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 31.5,
                    CurrentPressureBar = 3.38
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[1].Id,
                    Name = "Orchid Tower Riser Line (Block B)",
                    Code = "PIPE-TWR-B",
                    Material = "CPVC Schedule 80",
                    DiameterMm = 50.0,
                    MaxPressureBar = 5.0,
                    NominalPressureBar = 3.4,
                    NormalFlowLpm = 34.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 33.2,
                    CurrentPressureBar = 3.41
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[2].Id,
                    Name = "Magnolia Tower Riser Line (Block C)",
                    Code = "PIPE-TWR-C",
                    Material = "CPVC Schedule 80",
                    DiameterMm = 50.0,
                    MaxPressureBar = 5.0,
                    NominalPressureBar = 3.4,
                    NormalFlowLpm = 30.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 30.4,
                    CurrentPressureBar = 3.35
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    BuildingId = buildings[3].Id,
                    Name = "Jasmine Tower Riser Line (Block D)",
                    Code = "PIPE-TWR-D",
                    Material = "CPVC Schedule 80",
                    DiameterMm = 50.0,
                    MaxPressureBar = 5.0,
                    NominalPressureBar = 3.4,
                    NormalFlowLpm = 33.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 32.8,
                    CurrentPressureBar = 3.40
                },
                new Pipeline
                {
                    CommunityId = community.Id,
                    Name = "Community Irrigation & Landscaping Loop",
                    Code = "PIPE-IRRIG-01",
                    Material = "LLDPE Dripline / PVC",
                    DiameterMm = 32.0,
                    MaxPressureBar = 4.0,
                    NominalPressureBar = 2.5,
                    NormalFlowLpm = 18.0,
                    ValveStatus = ValveStatus.Open,
                    IsIsolated = false,
                    CurrentFlowLpm = 17.5,
                    CurrentPressureBar = 2.48
                }
            };
            context.Pipelines.AddRange(pipelines);
            context.SaveChanges();

            // 7. Sensors
            var sensors = new List<Sensor>
            {
                new Sensor
                {
                    PipelineId = pipelines[0].Id,
                    SensorCode = "SNS-FLOW-MAIN-01",
                    Name = "Main Trunk Electromagnetic Flow Transmitter",
                    SensorType = SensorType.Flow,
                    HardwareModel = "ESP32 + Modbus Ultrasonic Flow",
                    IsOnline = true,
                    BatteryLevel = 98.0,
                    CalibrationFactor = 7.5
                },
                new Sensor
                {
                    PipelineId = pipelines[0].Id,
                    SensorCode = "SNS-PRES-MAIN-01",
                    Name = "Main Trunk Piezoresistive Pressure Sensor",
                    SensorType = SensorType.Pressure,
                    HardwareModel = "ESP32 + 4-20mA Pressure Transducer",
                    IsOnline = true,
                    BatteryLevel = 95.0,
                    CalibrationFactor = 1.0
                },
                new Sensor
                {
                    TankId = tanks[0].Id,
                    SensorCode = "SNS-LVL-SUMP-01",
                    Name = "Central Reservoir Hydrostatic Level Gauge",
                    SensorType = SensorType.UltrasonicLevel,
                    HardwareModel = "ESP32 + Waterproof JSN-SR04T",
                    IsOnline = true,
                    BatteryLevel = 100.0,
                    CalibrationFactor = 0.0343
                },
                new Sensor
                {
                    PipelineId = pipelines[2].Id,
                    SensorCode = "SNS-FLOW-TWRA-01",
                    Name = "Tower A Pulse Flow Sensor",
                    SensorType = SensorType.Flow,
                    HardwareModel = "ESP32 + YF-S201 Hall Flow",
                    IsOnline = true,
                    BatteryLevel = 92.0,
                    CalibrationFactor = 7.5
                },
                new Sensor
                {
                    PipelineId = pipelines[2].Id,
                    SensorCode = "SNS-PRES-TWRA-01",
                    Name = "Tower A Pressure Sensor",
                    SensorType = SensorType.Pressure,
                    HardwareModel = "ESP32 + Ceramic Pressure Transducer",
                    IsOnline = true,
                    BatteryLevel = 91.0,
                    CalibrationFactor = 1.0
                },
                new Sensor
                {
                    PipelineId = pipelines[3].Id,
                    SensorCode = "SNS-FLOW-TWRB-01",
                    Name = "Tower B Pulse Flow Sensor",
                    SensorType = SensorType.Flow,
                    HardwareModel = "ESP32 + YF-S201 Hall Flow",
                    IsOnline = true,
                    BatteryLevel = 94.0,
                    CalibrationFactor = 7.5
                },
                new Sensor
                {
                    PipelineId = pipelines[4].Id,
                    SensorCode = "SNS-FLOW-TWRC-01",
                    Name = "Tower C Pulse Flow Sensor",
                    SensorType = SensorType.Flow,
                    HardwareModel = "ESP32 + YF-S201 Hall Flow",
                    IsOnline = true,
                    BatteryLevel = 88.0,
                    CalibrationFactor = 7.5
                },
                new Sensor
                {
                    PipelineId = pipelines[5].Id,
                    SensorCode = "SNS-FLOW-TWRD-01",
                    Name = "Tower D Pulse Flow Sensor",
                    SensorType = SensorType.Flow,
                    HardwareModel = "ESP32 + YF-S201 Hall Flow",
                    IsOnline = true,
                    BatteryLevel = 96.0,
                    CalibrationFactor = 7.5
                },
                new Sensor
                {
                    TankId = tanks[1].Id,
                    SensorCode = "SNS-LVL-ROOF-A",
                    Name = "Tower A Rooftop Ultrasonic Depth Sensor",
                    SensorType = SensorType.UltrasonicLevel,
                    HardwareModel = "ESP32 + JSN-SR04T",
                    IsOnline = true,
                    BatteryLevel = 89.0,
                    CalibrationFactor = 0.0343
                }
            };
            context.Sensors.AddRange(sensors);
            context.SaveChanges();

            // 8. 30 Days of Historical Consumption & Supply
            var startDate = DateTime.UtcNow.Date.AddDays(-30);
            var consumptionRecords = new List<ConsumptionRecord>();
            var supplyRecords = new List<WaterSupplyRecord>();

            for (int i = 0; i < 30; i++)
            {
                var curDate = startDate.AddDays(i);
                foreach (var b in buildings)
                {
                    consumptionRecords.Add(new ConsumptionRecord
                    {
                        BuildingId = b.Id,
                        RecordDate = curDate,
                        VolumeConsumedLitres = Math.Round(2800.0 + rand.NextDouble() * 500.0, 1),
                        PeakFlowRate = Math.Round(35.0 + rand.NextDouble() * 8.0, 1),
                        AbnormalConsumptionDetected = false,
                        CreatedAt = curDate
                    });
                }

                double daySupplied = Math.Round(12800.0 + rand.NextDouble() * 1400.0, 1);
                supplyRecords.Add(new WaterSupplyRecord
                {
                    CommunityId = community.Id,
                    TankId = tanks[0].Id,
                    SupplySource = "Municipal Water Supply Grid",
                    VolumeSuppliedLitres = daySupplied,
                    SupplyStart = curDate.AddHours(5),
                    SupplyEnd = curDate.AddHours(9),
                    CostEstimate = Math.Round(daySupplied * 0.003, 2),
                    CreatedAt = curDate
                });
            }
            context.ConsumptionRecords.AddRange(consumptionRecords);
            context.WaterSupplyRecords.AddRange(supplyRecords);
            context.SaveChanges();

            // 9. Initial Leakage Incidents (6 rich entries requested by user)
            var incidents = new List<LeakageIncident>
            {
                new LeakageIncident
                {
                    PipelineId = pipelines[3].Id,
                    BuildingId = buildings[1].Id,
                    DetectedAt = DateTime.UtcNow.AddDays(-2).AddHours(-4),
                    Severity = IncidentSeverity.High,
                    FlowRate = 54.2,
                    PressureReading = 2.15,
                    ConfidenceScore = 0.91,
                    DetectionReason = "Pressure drop of 1.25 bar coupled with 59% elevated branch flow",
                    Status = IncidentStatus.Resolved,
                    AssignedToUserId = users[1].Id,
                    ResolvedAt = DateTime.UtcNow.AddDays(-1).AddHours(-22),
                    Notes = "Replaced faulty PVC joint on Block B 2nd floor shaft. Tested under 4 bar pressure.",
                    EstimatedWaterLostLitres = 420.0
                },
                new LeakageIncident
                {
                    PipelineId = pipelines[1].Id,
                    DetectedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-20),
                    Severity = IncidentSeverity.Critical,
                    FlowRate = 158.4,
                    PressureReading = 1.35,
                    ConfidenceScore = 0.97,
                    DetectionReason = "Pipe Burst Alert: Hydraulic pressure collapse to 1.35 Bar with sudden 158.4 LPM surge. Sub-manifold auto-isolated.",
                    Status = IncidentStatus.Assigned,
                    AssignedToUserId = users[1].Id,
                    EstimatedWaterLostLitres = 680.0,
                    Notes = "Technician dispatched with ultrasonic leak detector. Branch manifold isolated."
                },
                new LeakageIncident
                {
                    PipelineId = pipelines[4].Id,
                    BuildingId = buildings[2].Id,
                    DetectedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-15),
                    Severity = IncidentSeverity.High,
                    FlowRate = 52.6,
                    PressureReading = 2.15,
                    ConfidenceScore = 0.93,
                    DetectionReason = "Abnormal continuous flow of 52.6 LPM detected with 1.25 Bar pressure drop across shaft riser",
                    Status = IncidentStatus.Detected,
                    EstimatedWaterLostLitres = 340.0,
                    Notes = "Alarm triggered by Rule 1 (Pressure Drop) and Rule 3 (Persistence)."
                },
                new LeakageIncident
                {
                    PipelineId = pipelines[2].Id,
                    BuildingId = buildings[0].Id,
                    HouseholdId = households[4].Id,
                    DetectedAt = DateTime.UtcNow.AddHours(-5).AddMinutes(-45),
                    Severity = IncidentSeverity.Medium,
                    FlowRate = 16.5,
                    PressureReading = 3.12,
                    ConfidenceScore = 0.88,
                    DetectionReason = "Mass-Balance Discrepancy: 18.2% unaccounted water flow between floor riser meter and sub-meters",
                    Status = IncidentStatus.Acknowledged,
                    AssignedToUserId = users[1].Id,
                    EstimatedWaterLostLitres = 145.0,
                    Notes = "Suspected hairline fissure near Apt A-202 manifold."
                },
                new LeakageIncident
                {
                    PipelineId = pipelines[6].Id,
                    DetectedAt = DateTime.UtcNow.AddHours(-8).AddMinutes(-10),
                    Severity = IncidentSeverity.Low,
                    FlowRate = 22.4,
                    PressureReading = 2.10,
                    ConfidenceScore = 0.82,
                    DetectionReason = "Continuous flow during scheduled non-irrigation window (02:30 - 04:15 UTC)",
                    Status = IncidentStatus.Acknowledged,
                    EstimatedWaterLostLitres = 210.0,
                    Notes = "Groundskeeping solenoid sticking open. Scheduled for O-ring gasket service."
                },
                new LeakageIncident
                {
                    PipelineId = pipelines[5].Id,
                    BuildingId = buildings[3].Id,
                    HouseholdId = households[19].Id,
                    DetectedAt = DateTime.UtcNow.AddDays(-1).AddHours(-8),
                    Severity = IncidentSeverity.Medium,
                    FlowRate = 34.0,
                    PressureReading = 3.20,
                    ConfidenceScore = 0.89,
                    DetectionReason = "ML Isolation Forest Anomaly: Hourly diurnal consumption vector diverged from baseline by 3.8 sigma",
                    Status = IncidentStatus.Resolved,
                    AssignedToUserId = users[1].Id,
                    ResolvedAt = DateTime.UtcNow.AddHours(-14),
                    EstimatedWaterLostLitres = 280.0,
                    Notes = "Cistern inlet valve replaced in Apartment D-102. Normal night curve verified."
                }
            };
            context.LeakageIncidents.AddRange(incidents);
            context.SaveChanges();

            // Maintenance Records
            context.MaintenanceRecords.Add(new MaintenanceRecord
            {
                IncidentId = incidents[0].Id,
                PipelineId = incidents[0].PipelineId,
                TechnicianUserId = users[1].Id,
                Status = MaintenanceStatus.Completed,
                WorkDescription = "Repaired fractured slip-joint on 50mm riser. Re-pressurized line and verified zero pressure loss.",
                PartsReplaced = "50mm CPVC coupling, heavy-duty solvent cement, rubber gasket",
                Cost = 85.0,
                StartedAt = DateTime.UtcNow.AddDays(-2).AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddDays(-1).AddHours(-22)
            });

            // Notifications
            context.Notifications.AddRange(new[]
            {
                new Notification
                {
                    IncidentId = incidents[1].Id,
                    Title = "CRITICAL: Pipe Burst on Secondary Manifold",
                    Message = "Pressure collapsed to 1.35 Bar with sudden 158.4 LPM surge. Automatic valve shutoff executed on TRUNK-SUB-02.",
                    AlertType = NotificationType.Leakage,
                    Severity = IncidentSeverity.Critical,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-19)
                },
                new Notification
                {
                    IncidentId = incidents[2].Id,
                    Title = "HIGH ALERT: Pressure Drop on Magnolia Tower (Block C)",
                    Message = "Continuous elevated flow of 52.6 LPM with 1.25 Bar pressure drop detected on PIPE-TWRC.",
                    AlertType = NotificationType.Leakage,
                    Severity = IncidentSeverity.High,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-14)
                },
                new Notification
                {
                    IncidentId = incidents[3].Id,
                    Title = "Warning: Discrepancy on Lotus Tower (Block A)",
                    Message = "Mass-balance discrepancy of 18.2% unaccounted water flow detected near Apt A-202 manifold.",
                    AlertType = NotificationType.Leakage,
                    Severity = IncidentSeverity.Medium,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-5).AddMinutes(-44)
                }
            });

            context.SaveChanges();
        }
    }
}
