using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AquaFlow.Server.Data;
using AquaFlow.Server.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AquaFlow.Server.Services
{
    public class IoTSimulatorBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly WebSocketManager _wsManager;
        private readonly ILogger<IoTSimulatorBackgroundService> _logger;
        private readonly Random _rand = new();

        public bool IsRunning { get; set; } = true;
        public string? ActiveScenario { get; set; } = null;
        public int? TargetPipelineId { get; set; } = null;
        public int TickCounter { get; private set; } = 0;

        public IoTSimulatorBackgroundService(
            IServiceProvider serviceProvider,
            WebSocketManager wsManager,
            ILogger<IoTSimulatorBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _wsManager = wsManager;
            _logger = logger;
        }

        public void InjectScenario(string scenario, int? pipelineId = null)
        {
            ActiveScenario = scenario;
            TargetPipelineId = pipelineId;
            _logger.LogWarning("Simulated anomaly injected: scenario='{Scenario}', targetPipelineId={PipelineId}", scenario, pipelineId);
        }

        public void ResetScenarios(AppDbContext db)
        {
            ActiveScenario = null;
            TargetPipelineId = null;

            var pipelines = db.Pipelines.ToList();
            foreach (var p in pipelines)
            {
                p.ValveStatus = ValveStatus.Open;
                p.IsIsolated = false;
                p.CurrentFlowLpm = p.NormalFlowLpm;
                p.CurrentPressureBar = p.NominalPressureBar;
            }
            db.SaveChanges();
            _logger.LogInformation("Simulation reset to normal steady state.");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AquaFlow C# IoT Hydraulic Simulation Service starting...");

            while (!stoppingToken.IsCancellationRequested)
            {
                if (IsRunning)
                {
                    try
                    {
                        await TickAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in simulation loop tick");
                    }
                }

                await Task.Delay(2000, stoppingToken);
            }
        }

        private async Task TickAsync()
        {
            TickCounter++;
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var detector = scope.ServiceProvider.GetRequiredService<LeakageDetectionEngine>();
            var automation = scope.ServiceProvider.GetRequiredService<AutomationService>();

            var pipelines = db.Pipelines.ToList();
            var tanks = db.WaterTanks.ToList();
            var households = db.Households.ToList();

            if (!pipelines.Any() || !tanks.Any()) return;

            double totalSystemFlow = 0.0;
            double sumHouseholdFlow = 0.0;

            // 1. Households micro consumption
            foreach (var hh in households)
            {
                double draw = _rand.NextDouble() < 0.6 ? 0.0 : (_rand.NextDouble() * 3.5);
                sumHouseholdFlow += draw;
                if (TickCounter % 5 == 0 && draw > 0)
                {
                    hh.CurrentDayUsageLitres += Math.Round(draw * (10.0 / 60.0), 2);
                }
            }

            // 2. Pipelines update
            foreach (var p in pipelines)
            {
                bool isTarget = (ActiveScenario != null) && (!TargetPipelineId.HasValue || TargetPipelineId.Value == p.Id);

                if (p.IsIsolated || p.ValveStatus == ValveStatus.Closed)
                {
                    p.CurrentFlowLpm = 0.0;
                    p.CurrentPressureBar = Math.Max(0.1, p.CurrentPressureBar - 0.2);
                }
                else if (isTarget && ActiveScenario == "pipe_burst")
                {
                    p.CurrentFlowLpm = Math.Round(p.NormalFlowLpm * (1.8 + _rand.NextDouble() * 0.6), 1);
                    p.CurrentPressureBar = Math.Round(0.9 + _rand.NextDouble() * 0.4, 2);
                }
                else if (isTarget && ActiveScenario == "micro_leak")
                {
                    p.CurrentFlowLpm = Math.Round(p.NormalFlowLpm * 1.35, 1);
                    p.CurrentPressureBar = Math.Round(p.NominalPressureBar * 0.92, 2);
                }
                else if (isTarget && ActiveScenario == "pressure_drop")
                {
                    p.CurrentFlowLpm = Math.Round(p.NormalFlowLpm * 0.9, 1);
                    p.CurrentPressureBar = Math.Round(1.2 + _rand.NextDouble() * 0.4, 2);
                }
                else
                {
                    double varFlow = (_rand.NextDouble() * 5.0) - 2.5;
                    p.CurrentFlowLpm = Math.Max(0.0, Math.Round(p.NormalFlowLpm + varFlow, 1));
                    p.CurrentPressureBar = Math.Round(p.NominalPressureBar + ((_rand.NextDouble() * 0.3) - 0.15), 2);
                }

                p.UpdatedAt = DateTime.UtcNow;
                totalSystemFlow += p.CurrentFlowLpm;

                double downstreamSum = (sumHouseholdFlow / Math.Max(1, pipelines.Count)) * 2.5;
                var incident = detector.EvaluatePipelineTelemetry(db, p, p.CurrentFlowLpm, p.CurrentPressureBar, downstreamSum);
                if (incident != null && incident.Severity == IncidentSeverity.Critical)
                {
                    automation.HandleCriticalIncident(db, incident);
                }
            }

            // 3. Tanks update
            foreach (var t in tanks)
            {
                if (ActiveScenario == "tank_drain" && t.TankType == TankType.OverheadTank)
                {
                    t.CurrentLevelPercentage = Math.Max(12.0, Math.Round(t.CurrentLevelPercentage - 2.5, 1));
                    t.CurrentLevelLitres = Math.Round(t.CapacityLitres * (t.CurrentLevelPercentage / 100.0), 1);
                }
                else
                {
                    double delta = (_rand.NextDouble() * 0.2) - 0.1;
                    t.CurrentLevelPercentage = Math.Max(20.0, Math.Min(98.0, Math.Round(t.CurrentLevelPercentage + delta, 1)));
                    t.CurrentLevelLitres = Math.Round(t.CapacityLitres * (t.CurrentLevelPercentage / 100.0), 1);
                }
                t.UpdatedAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            // 4. WebSocket Broadcast
            double avgPressure = pipelines.Average(p => p.CurrentPressureBar);
            var mainRes = tanks.FirstOrDefault(t => t.TankType == TankType.MainReservoir) ?? tanks[0];
            var ohTanks = tanks.Where(t => t.TankType == TankType.OverheadTank).ToList();
            double avgOhPct = ohTanks.Any() ? ohTanks.Average(t => t.CurrentLevelPercentage) : 75.0;

            var telemetryPayload = new
            {
                type = "TELEMETRY_TICK",
                data = new
                {
                    timestamp = DateTime.UtcNow.ToString("o"),
                    total_system_flow_lpm = Math.Round(totalSystemFlow, 1),
                    average_pressure_bar = Math.Round(avgPressure, 2),
                    main_reservoir_pct = mainRes.CurrentLevelPercentage,
                    main_reservoir_litres = mainRes.CurrentLevelLitres,
                    overhead_tanks_avg_pct = Math.Round(avgOhPct, 1),
                    active_scenario = ActiveScenario,
                    pipelines = pipelines.Select(p => new
                    {
                        id = p.Id,
                        code = p.Code,
                        name = p.Name,
                        flow_lpm = p.CurrentFlowLpm,
                        pressure_bar = p.CurrentPressureBar,
                        valve_status = p.ValveStatus.ToString().ToLower(),
                        is_isolated = p.IsIsolated
                    }),
                    tanks = tanks.Select(t => new
                    {
                        id = t.Id,
                        name = t.Name,
                        type = t.TankType.ToString().ToLower(),
                        level_pct = t.CurrentLevelPercentage,
                        level_litres = t.CurrentLevelLitres
                    })
                }
            };

            await _wsManager.BroadcastAsync(telemetryPayload);
        }
    }
}
