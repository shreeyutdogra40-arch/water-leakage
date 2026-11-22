using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AquaFlow.Server.Models
{
    public enum UserRole
    {
        Admin,
        Maintenance,
        Resident
    }

    public enum ValveStatus
    {
        Open,
        Closed,
        Throttled
    }

    public enum SensorType
    {
        Flow,
        Pressure,
        UltrasonicLevel,
        WaterQuality
    }

    public enum TankType
    {
        MainReservoir,
        OverheadTank,
        UndergroundSump
    }

    public enum IncidentSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum IncidentStatus
    {
        Detected,
        Acknowledged,
        Assigned,
        Resolved,
        Closed
    }

    public enum NotificationType
    {
        Leakage,
        LowTank,
        PressureAnomaly,
        OfflineSensor,
        QuotaExceeded,
        ValveAction,
        SystemInfo
    }

    public enum MaintenanceStatus
    {
        Scheduled,
        InProgress,
        Completed
    }

    public enum ValveActionType
    {
        ManualOpen,
        ManualClose,
        AutoIsolation,
        EmergencyShutdown
    }

    // 1. users
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("hashed_password")]
        public string HashedPassword { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("full_name")]
        public string FullName { get; set; } = string.Empty;

        [Column("role")]
        public UserRole Role { get; set; } = UserRole.Resident;

        [Column("household_id")]
        public int? HouseholdId { get; set; }

        [MaxLength(20)]
        [Column("phone_number")]
        public string? PhoneNumber { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("HouseholdId")]
        public virtual Household? Household { get; set; }
    }

    // 2. communities
    [Table("communities")]
    public class Community
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("location")]
        public string Location { get; set; } = string.Empty;

        [Column("total_capacity_litres")]
        public double TotalCapacityLitres { get; set; } = 140000.0;

        [Column("daily_budget_litres")]
        public double DailyBudgetLitres { get; set; } = 24000.0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<Building> Buildings { get; set; } = new List<Building>();
        public virtual ICollection<WaterTank> WaterTanks { get; set; } = new List<WaterTank>();
        public virtual ICollection<Pipeline> Pipelines { get; set; } = new List<Pipeline>();
    }

    // 3. buildings
    [Table("buildings")]
    public class Building
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("community_id")]
        public int CommunityId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("block_code")]
        public string BlockCode { get; set; } = string.Empty;

        [Column("total_households")]
        public int TotalHouseholds { get; set; } = 6;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("CommunityId")]
        public virtual Community? Community { get; set; }
        public virtual ICollection<Household> Households { get; set; } = new List<Household>();
        public virtual ICollection<WaterTank> WaterTanks { get; set; } = new List<WaterTank>();
        public virtual ICollection<Pipeline> Pipelines { get; set; } = new List<Pipeline>();
        public virtual ICollection<LeakageIncident> LeakageIncidents { get; set; } = new List<LeakageIncident>();
    }

    // 4. households
    [Table("households")]
    public class Household
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("building_id")]
        public int BuildingId { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("unit_number")]
        public string UnitNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("resident_name")]
        public string ResidentName { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("contact_phone")]
        public string? ContactPhone { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("meter_id")]
        public string MeterId { get; set; } = string.Empty;

        [Column("daily_quota_litres")]
        public double DailyQuotaLitres { get; set; } = 600.0;

        [Column("current_day_usage_litres")]
        public double CurrentDayUsageLitres { get; set; } = 0.0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BuildingId")]
        public virtual Building? Building { get; set; }
    }

    // 5. pipelines
    [Table("pipelines")]
    public class Pipeline
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("community_id")]
        public int CommunityId { get; set; }

        [Column("building_id")]
        public int? BuildingId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("material")]
        public string Material { get; set; } = "CPVC / HDPE";

        [Column("diameter_mm")]
        public double DiameterMm { get; set; } = 50.0;

        [Column("max_pressure_bar")]
        public double MaxPressureBar { get; set; } = 6.0;

        [Column("nominal_pressure_bar")]
        public double NominalPressureBar { get; set; } = 3.5;

        [Column("normal_flow_lpm")]
        public double NormalFlowLpm { get; set; } = 45.0;

        [Column("valve_status")]
        public ValveStatus ValveStatus { get; set; } = ValveStatus.Open;

        [Column("is_isolated")]
        public bool IsIsolated { get; set; } = false;

        [Column("current_flow_lpm")]
        public double CurrentFlowLpm { get; set; } = 0.0;

        [Column("current_pressure_bar")]
        public double CurrentPressureBar { get; set; } = 3.5;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BuildingId")]
        public virtual Building? Building { get; set; }
    }

    // 6. sensors
    [Table("sensors")]
    public class Sensor
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("pipeline_id")]
        public int? PipelineId { get; set; }

        [Column("tank_id")]
        public int? TankId { get; set; }

        [Column("household_id")]
        public int? HouseholdId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("sensor_code")]
        public string SensorCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("sensor_type")]
        public SensorType SensorType { get; set; }

        [MaxLength(50)]
        [Column("hardware_model")]
        public string HardwareModel { get; set; } = "ESP32 + YF-S201";

        [Column("is_online")]
        public bool IsOnline { get; set; } = true;

        [Column("last_heartbeat")]
        public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;

        [Column("battery_level")]
        public double BatteryLevel { get; set; } = 100.0;

        [Column("calibration_factor")]
        public double CalibrationFactor { get; set; } = 7.5;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PipelineId")]
        public virtual Pipeline? Pipeline { get; set; }

        [ForeignKey("TankId")]
        public virtual WaterTank? Tank { get; set; }
    }

    // 7. sensor_readings
    [Table("sensor_readings")]
    public class SensorReading
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("sensor_id")]
        public int SensorId { get; set; }

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Column("flow_rate_lpm")]
        public double? FlowRateLpm { get; set; }

        [Column("pressure_bar")]
        public double? PressureBar { get; set; }

        [Column("tank_level_percentage")]
        public double? TankLevelPercentage { get; set; }

        [Column("distance_cm")]
        public double? DistanceCm { get; set; }

        [Column("water_temperature_c")]
        public double? WaterTemperatureC { get; set; }

        [Column("is_anomaly")]
        public bool IsAnomaly { get; set; } = false;

        [MaxLength(200)]
        [Column("anomaly_reason")]
        public string? AnomalyReason { get; set; }

        [ForeignKey("SensorId")]
        public virtual Sensor? Sensor { get; set; }
    }

    // 8. water_tanks
    [Table("water_tanks")]
    public class WaterTank
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("community_id")]
        public int CommunityId { get; set; }

        [Column("building_id")]
        public int? BuildingId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("tank_type")]
        public TankType TankType { get; set; } = TankType.OverheadTank;

        [Column("capacity_litres")]
        public double CapacityLitres { get; set; } = 20000.0;

        [Column("current_level_litres")]
        public double CurrentLevelLitres { get; set; } = 16500.0;

        [Column("current_level_percentage")]
        public double CurrentLevelPercentage { get; set; } = 82.5;

        [Column("height_meters")]
        public double HeightMeters { get; set; } = 3.5;

        [Column("low_level_threshold_pct")]
        public double LowLevelThresholdPct { get; set; } = 25.0;

        [Column("is_filling")]
        public bool IsFilling { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BuildingId")]
        public virtual Building? Building { get; set; }
    }

    // 9. water_supply_records
    [Table("water_supply_records")]
    public class WaterSupplyRecord
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("community_id")]
        public int CommunityId { get; set; }

        [Column("tank_id")]
        public int? TankId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("supply_source")]
        public string SupplySource { get; set; } = "Municipal Grid";

        [Column("volume_supplied_litres")]
        public double VolumeSuppliedLitres { get; set; }

        [Column("supply_start")]
        public DateTime SupplyStart { get; set; }

        [Column("supply_end")]
        public DateTime? SupplyEnd { get; set; }

        [Column("cost_estimate")]
        public double CostEstimate { get; set; } = 0.0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TankId")]
        public virtual WaterTank? Tank { get; set; }
    }

    // 10. leakage_incidents
    [Table("leakage_incidents")]
    public class LeakageIncident
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("pipeline_id")]
        public int PipelineId { get; set; }

        [Column("household_id")]
        public int? HouseholdId { get; set; }

        [Column("building_id")]
        public int? BuildingId { get; set; }

        [Column("detected_at")]
        public DateTime DetectedAt { get; set; } = DateTime.UtcNow;

        [Column("severity")]
        public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;

        [Column("flow_rate")]
        public double FlowRate { get; set; }

        [Column("pressure_reading")]
        public double PressureReading { get; set; }

        [Column("confidence_score")]
        public double ConfidenceScore { get; set; } = 0.85;

        [Required]
        [MaxLength(255)]
        [Column("detection_reason")]
        public string DetectionReason { get; set; } = string.Empty;

        [Column("status")]
        public IncidentStatus Status { get; set; } = IncidentStatus.Detected;

        [Column("assigned_to_user_id")]
        public int? AssignedToUserId { get; set; }

        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("estimated_water_lost_litres")]
        public double EstimatedWaterLostLitres { get; set; } = 0.0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PipelineId")]
        public virtual Pipeline? Pipeline { get; set; }

        [ForeignKey("AssignedToUserId")]
        public virtual User? AssignedTechnician { get; set; }

        [ForeignKey("BuildingId")]
        public virtual Building? Building { get; set; }

        [ForeignKey("HouseholdId")]
        public virtual Household? Household { get; set; }
    }

    // 11. notifications
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Column("incident_id")]
        public int? IncidentId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Column("alert_type")]
        public NotificationType AlertType { get; set; } = NotificationType.Leakage;

        [Column("severity")]
        public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("IncidentId")]
        public virtual LeakageIncident? Incident { get; set; }
    }

    // 12. maintenance_records
    [Table("maintenance_records")]
    public class MaintenanceRecord
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("incident_id")]
        public int IncidentId { get; set; }

        [Column("pipeline_id")]
        public int PipelineId { get; set; }

        [Column("technician_user_id")]
        public int? TechnicianUserId { get; set; }

        [Column("status")]
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Scheduled;

        [Required]
        [Column("work_description")]
        public string WorkDescription { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("parts_replaced")]
        public string? PartsReplaced { get; set; }

        [Column("cost")]
        public double Cost { get; set; } = 0.0;

        [Column("started_at")]
        public DateTime? StartedAt { get; set; }

        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("IncidentId")]
        public virtual LeakageIncident? Incident { get; set; }

        [ForeignKey("TechnicianUserId")]
        public virtual User? Technician { get; set; }
    }

    // 13. valve_actions
    [Table("valve_actions")]
    public class ValveAction
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("pipeline_id")]
        public int PipelineId { get; set; }

        [Column("triggered_by_user_id")]
        public int? TriggeredByUserId { get; set; }

        [Column("action_type")]
        public ValveActionType ActionType { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("reason")]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("previous_status")]
        public string PreviousStatus { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("new_status")]
        public string NewStatus { get; set; } = string.Empty;

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [ForeignKey("PipelineId")]
        public virtual Pipeline? Pipeline { get; set; }

        [ForeignKey("TriggeredByUserId")]
        public virtual User? TriggeredByUser { get; set; }
    }

    // 14. consumption_records
    [Table("consumption_records")]
    public class ConsumptionRecord
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("household_id")]
        public int? HouseholdId { get; set; }

        [Column("building_id")]
        public int? BuildingId { get; set; }

        [Column("record_date")]
        public DateTime RecordDate { get; set; }

        [Column("volume_consumed_litres")]
        public double VolumeConsumedLitres { get; set; } = 0.0;

        [Column("peak_flow_rate")]
        public double PeakFlowRate { get; set; } = 0.0;

        [Column("abnormal_consumption_detected")]
        public bool AbnormalConsumptionDetected { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BuildingId")]
        public virtual Building? Building { get; set; }

        [ForeignKey("HouseholdId")]
        public virtual Household? Household { get; set; }
    }
}
