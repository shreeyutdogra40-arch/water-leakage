using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using AquaFlow.Server.Models;

namespace AquaFlow.Server.DTOs
{
    // Auth
    public class UserRegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Resident;
        public int? HouseholdId { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class UserLoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UserResponseDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "resident";
        public int? HouseholdId { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }

    public class TokenResponseDto
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = "bearer";

        [JsonPropertyName("user")]
        public UserResponseDto User { get; set; } = new();
    }

    // Monitoring
    public class PipelineDto
    {
        public int Id { get; set; }
        public int CommunityId { get; set; }
        public int? BuildingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public double DiameterMm { get; set; }
        public double MaxPressureBar { get; set; }
        public double NominalPressureBar { get; set; }
        public double NormalFlowLpm { get; set; }
        public string ValveStatus { get; set; } = "open";
        public bool IsIsolated { get; set; }
        public double CurrentFlowLpm { get; set; }
        public double CurrentPressureBar { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class TankDto
    {
        public int Id { get; set; }
        public int CommunityId { get; set; }
        public int? BuildingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "overhead_tank";
        public double CapacityLitres { get; set; }
        public double CurrentLevelLitres { get; set; }
        public double CurrentLevelPercentage { get; set; }
        public double HeightMeters { get; set; }
        public double LowLevelThresholdPct { get; set; }
        public bool IsFilling { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SensorDto
    {
        public int Id { get; set; }
        public string SensorCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SensorType { get; set; } = string.Empty;
        public string HardwareModel { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
        public DateTime LastHeartbeat { get; set; }
        public double BatteryLevel { get; set; }
        public int? PipelineId { get; set; }
        public int? TankId { get; set; }
    }

    public class SensorReadingCreateDto
    {
        public string SensorCode { get; set; } = string.Empty;
        public double? FlowRateLpm { get; set; }
        public double? PressureBar { get; set; }
        public double? TankLevelPercentage { get; set; }
        public double? DistanceCm { get; set; }
        public DateTime? Timestamp { get; set; }
    }

    public class SensorReadingDto
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public string? SensorCode { get; set; }
        public DateTime Timestamp { get; set; }
        public double? FlowRateLpm { get; set; }
        public double? PressureBar { get; set; }
        public double? TankLevelPercentage { get; set; }
        public bool IsAnomaly { get; set; }
        public string? AnomalyReason { get; set; }
    }

    public class LiveOverviewDto
    {
        public double TotalWaterSuppliedLitres { get; set; }
        public double TotalWaterConsumedLitres { get; set; }
        public double CurrentTotalFlowLpm { get; set; }
        public double AveragePipelinePressureBar { get; set; }
        public double MainReservoirLevelPct { get; set; }
        public double MainReservoirLitres { get; set; }
        public double OverheadTanksAveragePct { get; set; }
        public int ActiveLeakageIncidentsCount { get; set; }
        public int CriticalIncidentsCount { get; set; }
        public int ConnectedSensorsCount { get; set; }
        public int TotalSensorsCount { get; set; }
        public int IsolatedValvesCount { get; set; }
        public double EstimatedWaterWastageLitres { get; set; }
        public bool SimulationActive { get; set; }
        public string? ActiveAnomalyScenario { get; set; }
        public string Timestamp { get; set; } = string.Empty;
    }

    // Leakage
    public class IncidentDto
    {
        public int Id { get; set; }
        public int PipelineId { get; set; }
        public string? PipelineCode { get; set; }
        public string? PipelineName { get; set; }
        public int? HouseholdId { get; set; }
        public string? HouseholdUnit { get; set; }
        public int? BuildingId { get; set; }
        public string? BuildingName { get; set; }
        public DateTime DetectedAt { get; set; }
        public string Severity { get; set; } = "medium";
        public double FlowRate { get; set; }
        public double PressureReading { get; set; }
        public double ConfidenceScore { get; set; }
        public string DetectionReason { get; set; } = string.Empty;
        public string Status { get; set; } = "detected";
        public int? AssignedToUserId { get; set; }
        public string? AssignedTechnicianName { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? Notes { get; set; }
        public double EstimatedWaterLostLitres { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class IncidentStatusUpdateDto
    {
        public string Status { get; set; } = "acknowledged";
        public int? AssignedToUserId { get; set; }
        public string? Notes { get; set; }
    }

    public class IncidentDetectRequestDto
    {
        public int PipelineId { get; set; }
        public double FlowRate { get; set; }
        public double PressureReading { get; set; }
        public string? Reason { get; set; }
        public string? ForceSeverity { get; set; }
    }

    public class MLAnalyzeRequestDto
    {
        public List<double> HourlyConsumption24h { get; set; } = new();
    }

    // Supply
    public class BuildingSummaryDto
    {
        public int Id { get; set; }
        public int CommunityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BlockCode { get; set; } = string.Empty;
        public int TotalHouseholds { get; set; }
        public double TodayConsumptionLitres { get; set; }
        public double CurrentFlowLpm { get; set; }
        public string? TankName { get; set; }
        public double? TankLevelPct { get; set; }
        public int ActiveLeaksCount { get; set; }
    }

    public class HouseholdDto
    {
        public int Id { get; set; }
        public int BuildingId { get; set; }
        public string? BuildingName { get; set; }
        public string UnitNumber { get; set; } = string.Empty;
        public string ResidentName { get; set; } = string.Empty;
        public string? ContactPhone { get; set; }
        public string MeterId { get; set; } = string.Empty;
        public double DailyQuotaLitres { get; set; }
        public double CurrentDayUsageLitres { get; set; }
        public double QuotaUsagePercentage { get; set; }
        public bool HasAnomaly { get; set; }
    }

    // Actions
    public class ValveControlDto
    {
        public string Action { get; set; } = "manual_close"; // manual_open, manual_close, emergency_shutdown
        public string Reason { get; set; } = string.Empty;
    }

    public class ValveActionDto
    {
        public int Id { get; set; }
        public int PipelineId { get; set; }
        public string? PipelineName { get; set; }
        public int? TriggeredByUserId { get; set; }
        public string? TriggeredByName { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string PreviousStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class NotificationDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public int? IncidentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string AlertType { get; set; } = "leakage";
        public string Severity { get; set; } = "medium";
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Analytics
    public class DailyConsumptionPointDto
    {
        public string Date { get; set; } = string.Empty;
        public double SuppliedLitres { get; set; }
        public double ConsumedLitres { get; set; }
        public double WastageLitres { get; set; }
        public double EfficiencyPct { get; set; }
    }

    public class BuildingComparisonDto
    {
        public int BuildingId { get; set; }
        public string BuildingName { get; set; } = string.Empty;
        public double TotalConsumptionLitres { get; set; }
        public double HouseholdAvgLitres { get; set; }
        public double QuotaLitres { get; set; }
        public double ExcessLitres { get; set; }
    }

    public class WastageAnalysisDto
    {
        public double TotalSuppliedPeriodLitres { get; set; }
        public double TotalConsumedPeriodLitres { get; set; }
        public double TotalWastageLitres { get; set; }
        public double LeakageLossLitres { get; set; }
        public double UnaccountedLossLitres { get; set; }
        public double WastagePercentage { get; set; }
        public double FinancialLossEstimate { get; set; }
        public double PreventedWastageLitres { get; set; }
    }

    public class SimulationInjectDto
    {
        public string Scenario { get; set; } = "pipe_burst";
        public int? PipelineId { get; set; }
    }

    public class IncidentStatsDto
    {
        public int TotalIncidents { get; set; }
        public int ActiveIncidents { get; set; }
        public int ResolvedIncidents { get; set; }
        public int CriticalCount { get; set; }
        public int HighCount { get; set; }
        public int MediumCount { get; set; }
        public int LowCount { get; set; }
        public double AverageResolutionTimeMinutes { get; set; }
        public int AutoIsolatedCount { get; set; }
    }

    public class PipelineCreateDto
    {
        public int CommunityId { get; set; }
        public int? BuildingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Material { get; set; } = "CPVC / HDPE";
        public double DiameterMm { get; set; } = 50.0;
        public double MaxPressureBar { get; set; } = 6.0;
        public double NominalPressureBar { get; set; } = 3.5;
        public double NormalFlowLpm { get; set; } = 45.0;
    }
}
