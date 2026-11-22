using System;
using System.Linq;
using AquaFlow.Server.Data;
using AquaFlow.Server.Models;

namespace AquaFlow.Server.Services
{
    public class AutomationService
    {
        public bool HandleCriticalIncident(AppDbContext db, LeakageIncident incident)
        {
            if (incident.Severity != IncidentSeverity.Critical) return false;

            var pipeline = db.Pipelines.FirstOrDefault(p => p.Id == incident.PipelineId);
            if (pipeline == null || pipeline.IsIsolated) return false;

            // Safety Rule 10: Never close main community arterial line automatically
            if (!pipeline.BuildingId.HasValue && pipeline.Name.ToLower().Contains("main"))
            {
                db.Notifications.Add(new Notification
                {
                    Title = "SAFETY ALERT: Main Trunk Critical Leak",
                    Message = $"Critical leak detected on primary transmission header {pipeline.Name}. Auto-isolation halted by safety policy. Manual administrator override required!",
                    AlertType = NotificationType.ValveAction,
                    Severity = IncidentSeverity.Critical,
                    IncidentId = incident.Id > 0 ? incident.Id : null,
                    CreatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
                return false;
            }

            // Execute automated branch riser isolation
            string prevStatus = pipeline.ValveStatus.ToString().ToLower();
            pipeline.ValveStatus = ValveStatus.Closed;
            pipeline.IsIsolated = true;
            pipeline.CurrentFlowLpm = 0.0;
            pipeline.UpdatedAt = DateTime.UtcNow;

            db.ValveActions.Add(new ValveAction
            {
                PipelineId = pipeline.Id,
                ActionType = ValveActionType.AutoIsolation,
                Reason = $"Automated isolation triggered by Critical Leakage Incident #{incident.Id}: {incident.DetectionReason}",
                PreviousStatus = prevStatus,
                NewStatus = "closed",
                Timestamp = DateTime.UtcNow
            });

            db.Notifications.Add(new Notification
            {
                Title = $"Valve Auto-Isolated: {pipeline.Name}",
                Message = $"Automatic isolation executed for pipeline {pipeline.Code} to prevent catastrophic flooding. Incident #{incident.Id}.",
                AlertType = NotificationType.ValveAction,
                Severity = IncidentSeverity.Critical,
                IncidentId = incident.Id > 0 ? incident.Id : null,
                CreatedAt = DateTime.UtcNow
            });

            db.SaveChanges();
            return true;
        }

        public Pipeline ControlValve(AppDbContext db, int pipelineId, string actionTypeStr, string reason, User? user = null)
        {
            var pipeline = db.Pipelines.FirstOrDefault(p => p.Id == pipelineId);
            if (pipeline == null) throw new ArgumentException($"Pipeline #{pipelineId} not found");

            string prevStatus = pipeline.ValveStatus.ToString().ToLower();
            var actionType = actionTypeStr.ToLower() switch
            {
                "manual_open" => ValveActionType.ManualOpen,
                "manual_close" => ValveActionType.ManualClose,
                "emergency_shutdown" => ValveActionType.EmergencyShutdown,
                _ => ValveActionType.ManualClose
            };

            string newStatus;
            if (actionType == ValveActionType.ManualOpen)
            {
                pipeline.ValveStatus = ValveStatus.Open;
                pipeline.IsIsolated = false;
                newStatus = "open";
            }
            else
            {
                pipeline.ValveStatus = ValveStatus.Closed;
                pipeline.IsIsolated = (actionType == ValveActionType.EmergencyShutdown);
                pipeline.CurrentFlowLpm = 0.0;
                newStatus = "closed";
            }

            pipeline.UpdatedAt = DateTime.UtcNow;

            db.ValveActions.Add(new ValveAction
            {
                PipelineId = pipeline.Id,
                TriggeredByUserId = user?.Id,
                ActionType = actionType,
                Reason = reason,
                PreviousStatus = prevStatus,
                NewStatus = newStatus,
                Timestamp = DateTime.UtcNow
            });

            db.Notifications.Add(new Notification
            {
                Title = $"Valve Control: {pipeline.Name}",
                Message = $"Valve set to {newStatus.ToUpper()} ({actionTypeStr}) by {user?.FullName ?? "Administrator"}. Reason: {reason}",
                AlertType = NotificationType.ValveAction,
                Severity = IncidentSeverity.Medium,
                CreatedAt = DateTime.UtcNow
            });

            db.SaveChanges();
            return pipeline;
        }
    }
}
