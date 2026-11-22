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
    public class MonitoringController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly LeakageDetectionEngine _leakageEngine;
        private readonly AutomationService _automation;

        public MonitoringController(AppDbContext db, LeakageDetectionEngine leakageEngine, AutomationService automation)
        {
            _db = db;
            _leakageEngine = leakageEngine;
            _automation = automation;
        }

        [HttpGet("live")]
        public async Task<IActionResult> GetLiveSnapshot()
        {
            var pipelines = await _db.Pipelines.ToListAsync();
            var tanks = await _db.WaterTanks.ToListAsync();
            var sensors = await _db.Sensors.ToListAsync();

            var pipelineDtos = pipelines.Select(p => new PipelineDto
            {
                Id = p.Id,
                CommunityId = p.CommunityId,
                BuildingId = p.BuildingId,
                Name = p.Name,
                Code = p.Code,
                Material = p.Material,
                DiameterMm = p.DiameterMm,
                MaxPressureBar = p.MaxPressureBar,
                NominalPressureBar = p.NominalPressureBar,
                NormalFlowLpm = p.NormalFlowLpm,
                ValveStatus = p.ValveStatus.ToString().ToLower(),
                IsIsolated = p.IsIsolated,
                CurrentFlowLpm = p.CurrentFlowLpm,
                CurrentPressureBar = p.CurrentPressureBar,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            var tankDtos = tanks.Select(t => new
            {
                id = t.Id,
                name = t.Name,
                type = t.TankType.ToString().ToLower(),
                capacity_litres = t.CapacityLitres,
                current_level_litres = t.CurrentLevelLitres,
                current_level_percentage = t.CurrentLevelPercentage,
                is_filling = t.IsFilling
            }).ToList();

            return Ok(new
            {
                timestamp = DateTime.UtcNow.ToString("o"),
                pipelines = pipelineDtos,
                tanks = tankDtos,
                sensor_health = new
                {
                    total = sensors.Count,
                    online = sensors.Count(s => s.IsOnline),
                    offline = sensors.Count(s => !s.IsOnline),
                    low_battery = sensors.Count(s => s.BatteryLevel < 20.0)
                }
            });
        }

        [HttpGet("readings")]
        public async Task<ActionResult<List<SensorReadingDto>>> GetReadings(
            [FromQuery] int? sensor_id = null,
            [FromQuery] int limit = 50,
            [FromQuery] bool anomalies_only = false)
        {
            limit = Math.Clamp(limit, 1, 500);
            var query = _db.SensorReadings.Include(r => r.Sensor).AsQueryable();

            if (sensor_id.HasValue)
            {
                query = query.Where(r => r.SensorId == sensor_id.Value);
            }

            if (anomalies_only)
            {
                query = query.Where(r => r.IsAnomaly);
            }

            var readings = await query
                .OrderByDescending(r => r.Timestamp)
                .Take(limit)
                .ToListAsync();

            var result = readings.Select(r => new SensorReadingDto
            {
                Id = r.Id,
                SensorId = r.SensorId,
                SensorCode = r.Sensor?.SensorCode,
                Timestamp = r.Timestamp,
                FlowRateLpm = r.FlowRateLpm,
                PressureBar = r.PressureBar,
                TankLevelPercentage = r.TankLevelPercentage,
                IsAnomaly = r.IsAnomaly,
                AnomalyReason = r.AnomalyReason
            }).ToList();

            return Ok(result);
        }

        [HttpPost("readings")]
        public async Task<IActionResult> IngestReading([FromBody] SensorReadingCreateDto dto)
        {
            var sensor = await _db.Sensors.FirstOrDefaultAsync(s => s.SensorCode == dto.SensorCode);
            if (sensor == null)
            {
                return NotFound(new { detail = $"Sensor code {dto.SensorCode} not registered" });
            }

            sensor.LastHeartbeat = DateTime.UtcNow;
            sensor.IsOnline = true;

            var reading = new SensorReading
            {
                SensorId = sensor.Id,
                Timestamp = dto.Timestamp ?? DateTime.UtcNow,
                FlowRateLpm = dto.FlowRateLpm,
                PressureBar = dto.PressureBar,
                TankLevelPercentage = dto.TankLevelPercentage,
                DistanceCm = dto.DistanceCm,
                IsAnomaly = false,
                AnomalyReason = null
            };

            // If sensor belongs to pipeline, evaluate telemetry
            if (sensor.PipelineId.HasValue)
            {
                var pipeline = await _db.Pipelines.FindAsync(sensor.PipelineId.Value);
                if (pipeline != null)
                {
                    if (dto.FlowRateLpm.HasValue) pipeline.CurrentFlowLpm = dto.FlowRateLpm.Value;
                    if (dto.PressureBar.HasValue) pipeline.CurrentPressureBar = dto.PressureBar.Value;
                    pipeline.UpdatedAt = DateTime.UtcNow;

                    var incident = _leakageEngine.EvaluatePipelineTelemetry(
                        _db,
                        pipeline,
                        pipeline.CurrentFlowLpm,
                        pipeline.CurrentPressureBar
                    );

                    if (incident != null)
                    {
                        reading.IsAnomaly = true;
                        reading.AnomalyReason = incident.DetectionReason;

                        if (incident.Severity == IncidentSeverity.Critical)
                        {
                            _automation.HandleCriticalIncident(_db, incident);
                        }
                    }
                }
            }
            else if (sensor.TankId.HasValue)
            {
                var tank = await _db.WaterTanks.FindAsync(sensor.TankId.Value);
                if (tank != null && dto.TankLevelPercentage.HasValue)
                {
                    tank.CurrentLevelPercentage = dto.TankLevelPercentage.Value;
                    tank.CurrentLevelLitres = Math.Round((dto.TankLevelPercentage.Value / 100.0) * tank.CapacityLitres, 1);
                    tank.UpdatedAt = DateTime.UtcNow;

                    if (tank.CurrentLevelPercentage <= tank.LowLevelThresholdPct)
                    {
                        reading.IsAnomaly = true;
                        reading.AnomalyReason = $"Tank level dropped below minimum threshold ({tank.CurrentLevelPercentage:F1}% <= {tank.LowLevelThresholdPct:F1}%)";
                    }
                }
            }

            _db.SensorReadings.Add(reading);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                status = "ingested",
                sensor_code = sensor.SensorCode,
                reading_id = reading.Id,
                is_anomaly = reading.IsAnomaly,
                reason = reading.AnomalyReason
            });
        }

        [HttpGet("sensors")]
        public async Task<ActionResult<List<SensorDto>>> GetSensors()
        {
            var sensors = await _db.Sensors.ToListAsync();
            var dtos = sensors.Select(s => new SensorDto
            {
                Id = s.Id,
                SensorCode = s.SensorCode,
                Name = s.Name,
                SensorType = s.SensorType.ToString().ToLower(),
                HardwareModel = s.HardwareModel,
                IsOnline = s.IsOnline,
                LastHeartbeat = s.LastHeartbeat,
                BatteryLevel = s.BatteryLevel,
                PipelineId = s.PipelineId,
                TankId = s.TankId
            }).ToList();

            return Ok(dtos);
        }
    }
}
