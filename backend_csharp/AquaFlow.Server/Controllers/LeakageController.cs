using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AquaFlow.Server.Data;
using AquaFlow.Server.DTOs;
using AquaFlow.Server.Models;
using AquaFlow.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AquaFlow.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeakageController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly LeakageDetectionEngine _leakageEngine;
        private readonly AutomationService _automation;

        public LeakageController(AppDbContext db, LeakageDetectionEngine leakageEngine, AutomationService automation)
        {
            _db = db;
            _leakageEngine = leakageEngine;
            _automation = automation;
        }

        private static IncidentDto MapToDto(LeakageIncident i)
        {
            return new IncidentDto
            {
                Id = i.Id,
                PipelineId = i.PipelineId,
                PipelineCode = i.Pipeline?.Code,
                PipelineName = i.Pipeline?.Name,
                HouseholdId = i.HouseholdId,
                HouseholdUnit = i.Household?.UnitNumber,
                BuildingId = i.BuildingId,
                BuildingName = i.Building?.Name,
                DetectedAt = i.DetectedAt,
                Severity = i.Severity.ToString().ToLower(),
                FlowRate = i.FlowRate,
                PressureReading = i.PressureReading,
                ConfidenceScore = i.ConfidenceScore,
                DetectionReason = i.DetectionReason,
                Status = i.Status.ToString().ToLower(),
                AssignedToUserId = i.AssignedToUserId,
                AssignedTechnicianName = i.AssignedTechnician?.FullName,
                ResolvedAt = i.ResolvedAt,
                Notes = i.Notes,
                EstimatedWaterLostLitres = i.EstimatedWaterLostLitres,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            };
        }

        [HttpGet("incidents")]
        public async Task<ActionResult<List<IncidentDto>>> GetIncidents(
            [FromQuery] string? status_filter = null,
            [FromQuery] string? severity_filter = null,
            [FromQuery] int? pipeline_id = null)
        {
            var query = _db.LeakageIncidents
                .Include(i => i.Pipeline)
                .Include(i => i.Building)
                .Include(i => i.Household)
                .Include(i => i.AssignedTechnician)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status_filter) && Enum.TryParse<IncidentStatus>(status_filter, true, out var st))
            {
                query = query.Where(i => i.Status == st);
            }

            if (!string.IsNullOrEmpty(severity_filter) && Enum.TryParse<IncidentSeverity>(severity_filter, true, out var sev))
            {
                query = query.Where(i => i.Severity == sev);
            }

            if (pipeline_id.HasValue)
            {
                query = query.Where(i => i.PipelineId == pipeline_id.Value);
            }

            var incidents = await query.OrderByDescending(i => i.DetectedAt).ToListAsync();
            return Ok(incidents.Select(MapToDto).ToList());
        }

        [HttpPost("detect")]
        public async Task<ActionResult<IncidentDto>> TriggerDetection([FromBody] IncidentDetectRequestDto req)
        {
            var pipeline = await _db.Pipelines
                .Include(p => p.Building)
                .FirstOrDefaultAsync(p => p.Id == req.PipelineId);

            if (pipeline == null)
            {
                return NotFound(new { detail = "Pipeline not found" });
            }

            LeakageIncident? incident = _leakageEngine.EvaluatePipelineTelemetry(
                _db,
                pipeline,
                req.FlowRate,
                req.PressureReading
            );

            if (incident == null && !string.IsNullOrEmpty(req.ForceSeverity))
            {
                if (Enum.TryParse<IncidentSeverity>(req.ForceSeverity, true, out var forcedSev))
                {
                    incident = _leakageEngine.RecordIncident(
                        _db,
                        pipeline,
                        req.FlowRate,
                        req.PressureReading,
                        forcedSev,
                        0.95,
                        req.Reason ?? "Manual diagnostic test trigger"
                    );
                }
            }

            if (incident == null)
            {
                return BadRequest(new
                {
                    detail = "Parameters did not exceed anomaly threshold. Flow and pressure are within operational bounds."
                });
            }

            if (incident.Severity == IncidentSeverity.Critical)
            {
                _automation.HandleCriticalIncident(_db, incident);
            }

            incident = await _db.LeakageIncidents
                .Include(i => i.Pipeline)
                .Include(i => i.Building)
                .Include(i => i.Household)
                .Include(i => i.AssignedTechnician)
                .FirstOrDefaultAsync(i => i.Id == incident.Id);

            return Ok(MapToDto(incident!));
        }

        [HttpPatch("incidents/{id}/status")]
        public async Task<ActionResult<IncidentDto>> UpdateIncidentStatus(int id, [FromBody] IncidentStatusUpdateDto update)
        {
            var incident = await _db.LeakageIncidents
                .Include(i => i.Pipeline)
                .Include(i => i.Building)
                .Include(i => i.Household)
                .Include(i => i.AssignedTechnician)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (incident == null)
            {
                return NotFound(new { detail = "Incident not found" });
            }

            if (Enum.TryParse<IncidentStatus>(update.Status, true, out var newStatus))
            {
                incident.Status = newStatus;
            }

            if (update.AssignedToUserId.HasValue)
            {
                incident.AssignedToUserId = update.AssignedToUserId.Value;
            }

            if (!string.IsNullOrEmpty(update.Notes))
            {
                incident.Notes = (incident.Notes ?? "") + $"\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {update.Notes}";
            }

            if (incident.Status == IncidentStatus.Resolved || incident.Status == IncidentStatus.Closed)
            {
                incident.ResolvedAt = DateTime.UtcNow;

                _db.Notifications.Add(new Notification
                {
                    Title = $"Incident #{incident.Id} Resolved",
                    Message = $"Leakage incident on {incident.Pipeline?.Name ?? "pipeline"} marked as {incident.Status.ToString().ToUpper()}.",
                    AlertType = NotificationType.Leakage,
                    Severity = IncidentSeverity.Low,
                    IncidentId = incident.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }

            incident.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(MapToDto(incident));
        }

        [HttpPost("ml-analyze")]
        public IActionResult RunMLConsumptionAnalysis([FromBody] MLAnalyzeRequestDto req)
        {
            var (isAnomaly, confidence) = _leakageEngine.ScoreHourlyConsumptionProfile(req.HourlyConsumption24h);
            return Ok(new
            {
                model = "IsolationForest(contamination=0.08)",
                is_anomaly = isAnomaly,
                confidence_score = Math.Round(confidence, 3),
                verdict = isAnomaly ? "ABNORMAL CONSUMPTION DETECTED" : "NORMAL DIURNAL PATTERN",
                description = isAnomaly
                    ? "Unusual consumption profile identified by machine learning algorithm comparing against trained 24-hour residential baseline."
                    : "Flow curve aligns with typical residential morning/evening consumption peaks."
            });
        }
    }
}
