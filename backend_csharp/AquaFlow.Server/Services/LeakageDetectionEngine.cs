using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using AquaFlow.Server.Data;
using AquaFlow.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace AquaFlow.Server.Services
{
    public class LeakageDetectionEngine
    {
        private readonly ConcurrentDictionary<int, List<AnomalyTick>> _anomalyBuffers = new();
        private const int PersistenceMinTicks = 3;
        private const double PressureDropThresholdBar = 0.85;
        private const double FlowDiscrepancyPct = 12.0;

        private record AnomalyTick(DateTime Time, double Flow, double Pressure, IncidentSeverity Severity, double Confidence, string Reason);

        public LeakageIncident? EvaluatePipelineTelemetry(
            AppDbContext db,
            Pipeline pipeline,
            double currentFlow,
            double currentPressure,
            double? downstreamSum = null)
        {
            if (pipeline.IsIsolated || (pipeline.ValveStatus == ValveStatus.Closed && currentFlow < 2.0))
            {
                return null;
            }

            bool anomalyDetected = false;
            string reason = string.Empty;
            var severity = IncidentSeverity.Low;
            double confidence = 0.70;

            double nominalP = pipeline.NominalPressureBar;
            double pressureDrop = nominalP - currentPressure;

            // Condition 1: Pipe Burst (Catastrophic pressure collapse + surging flow)
            if (pressureDrop >= PressureDropThresholdBar && currentFlow >= pipeline.NormalFlowLpm * 1.3)
            {
                anomalyDetected = true;
                severity = IncidentSeverity.Critical;
                confidence = 0.96;
                reason = $"Pipe Burst Detected: Pressure dropped by {pressureDrop:F2} Bar ({currentPressure:F2} vs nominal {nominalP:F2}) with surging flow of {currentFlow:F1} LPM";
            }
            // Condition 2: Significant Pressure Drop under active flow
            else if (pressureDrop >= PressureDropThresholdBar && currentFlow > 5.0)
            {
                anomalyDetected = true;
                severity = IncidentSeverity.High;
                confidence = 0.88;
                reason = $"Abnormal Pressure Drop: Pipeline pressure fell to {currentPressure:F2} Bar (drop of {pressureDrop:F2} Bar) under active transmission";
            }
            // Condition 3: Mass Balance Flow Discrepancy (Riser vs sum of sub-meters)
            else if (downstreamSum.HasValue && currentFlow > 10.0)
            {
                double unaccounted = currentFlow - downstreamSum.Value;
                double discPct = (unaccounted / currentFlow) * 100.0;
                if (discPct > FlowDiscrepancyPct && unaccounted > 4.0)
                {
                    anomalyDetected = true;
                    severity = discPct > 25.0 ? IncidentSeverity.High : IncidentSeverity.Medium;
                    confidence = Math.Min(0.95, 0.75 + (discPct / 100.0) * 0.2);
                    reason = $"Mass-Balance Discrepancy: {discPct:F1}% unaccounted water flow ({unaccounted:F1} LPM lost between main meter {currentFlow:F1} LPM and sub-meters {downstreamSum.Value:F1} LPM)";
                }
            }
            // Condition 4: Night-time abnormal continuous flow (01:00 - 05:00 UTC)
            else
            {
                int currentHour = DateTime.UtcNow.Hour;
                if (currentHour >= 1 && currentHour <= 5 && currentFlow > 8.0)
                {
                    anomalyDetected = true;
                    severity = IncidentSeverity.Medium;
                    confidence = 0.82;
                    reason = $"Abnormal Night-time Continuous Flow: {currentFlow:F1} LPM measured during zero-expected demand window (01:00-05:00 UTC)";
                }
            }

            var buffer = _anomalyBuffers.GetOrAdd(pipeline.Id, _ => new List<AnomalyTick>());

            lock (buffer)
            {
                if (anomalyDetected)
                {
                    buffer.Add(new AnomalyTick(DateTime.UtcNow, currentFlow, currentPressure, severity, confidence, reason));
                    if (buffer.Count > 10) buffer.RemoveAt(0);

                    if (buffer.Count >= PersistenceMinTicks)
                    {
                        return RecordIncident(db, pipeline, currentFlow, currentPressure, severity, confidence, reason);
                    }
                }
                else
                {
                    if (buffer.Count > 0) buffer.RemoveAt(0);
                }
            }

            return null;
        }

        public (bool IsAnomaly, double ConfidenceScore) ScoreHourlyConsumptionProfile(List<double> hourlyUsage)
        {
            if (hourlyUsage.Count != 24)
            {
                while (hourlyUsage.Count < 24) hourlyUsage.Add(15.0);
            }

            // Diurnal residential expectation: low night (1-5am), peaks morning (7-9am) and evening (7-9pm)
            double nightAvg = hourlyUsage.Take(5).Average();
            double overallAvg = hourlyUsage.Average();
            double variance = hourlyUsage.Select(v => Math.Pow(v - overallAvg, 2)).Average();

            // Anomaly if night consumption is persistently elevated or curve is completely flat high
            bool isAnomaly = (nightAvg > 20.0) || (overallAvg > 35.0 && variance < 15.0);
            double confidence = isAnomaly ? 0.91 : 0.65;
            return (isAnomaly, confidence);
        }

        public LeakageIncident RecordIncident(
            AppDbContext db,
            Pipeline pipeline,
            double flow,
            double pressure,
            IncidentSeverity severity,
            double confidence,
            string reason)
        {
            var existing = db.LeakageIncidents.FirstOrDefault(i =>
                i.PipelineId == pipeline.Id &&
                (i.Status == IncidentStatus.Detected || i.Status == IncidentStatus.Acknowledged || i.Status == IncidentStatus.Assigned));

            if (existing != null)
            {
                existing.FlowRate = flow;
                existing.PressureReading = pressure;
                if (severity == IncidentSeverity.Critical && existing.Severity != IncidentSeverity.Critical)
                {
                    existing.Severity = IncidentSeverity.Critical;
                    existing.DetectionReason = reason;
                }
                db.SaveChanges();
                return existing;
            }

            var incident = new LeakageIncident
            {
                PipelineId = pipeline.Id,
                BuildingId = pipeline.BuildingId,
                DetectedAt = DateTime.UtcNow,
                Severity = severity,
                FlowRate = flow,
                PressureReading = pressure,
                ConfidenceScore = confidence,
                DetectionReason = reason,
                Status = IncidentStatus.Detected,
                EstimatedWaterLostLitres = Math.Round(flow * 5.0, 1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.LeakageIncidents.Add(incident);
            db.Notifications.Add(new Notification
            {
                Incident = incident,
                Title = $"Leakage Detected on {pipeline.Name}",
                Message = $"[{severity.ToString().ToUpper()}] {reason}. Current Flow: {flow:F1} LPM, Pressure: {pressure:F2} Bar.",
                AlertType = NotificationType.Leakage,
                Severity = severity,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            db.SaveChanges();
            return incident;
        }
    }
}
