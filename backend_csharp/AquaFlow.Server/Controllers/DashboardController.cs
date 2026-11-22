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
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IoTSimulatorBackgroundService _simulator;

        public DashboardController(AppDbContext db, IoTSimulatorBackgroundService simulator)
        {
            _db = db;
            _simulator = simulator;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var today = DateTime.UtcNow.Date;

            var pipelines = await _db.Pipelines.ToListAsync();
            double totalFlow = pipelines.Sum(p => p.CurrentFlowLpm);
            double avgPressure = pipelines.Count > 0 ? pipelines.Average(p => p.CurrentPressureBar) : 0.0;
            int isolatedValves = pipelines.Count(p => p.IsIsolated || p.ValveStatus == ValveStatus.Closed);

            var tanks = await _db.WaterTanks.ToListAsync();
            var mainRes = tanks.FirstOrDefault(t => t.TankType == TankType.MainReservoir) ?? tanks.FirstOrDefault();
            var ohTanks = tanks.Where(t => t.TankType == TankType.OverheadTank).ToList();
            double avgOhLevel = ohTanks.Count > 0 ? ohTanks.Average(t => t.CurrentLevelPercentage) : 0.0;

            double todayConsumed = await _db.ConsumptionRecords
                .Where(c => c.RecordDate.Date == today)
                .SumAsync(c => (double?)c.VolumeConsumedLitres) ?? 0.0;

            double todaySupplied = await _db.WaterSupplyRecords
                .Where(s => s.SupplyStart.Date == today)
                .SumAsync(s => (double?)s.VolumeSuppliedLitres) ?? (todayConsumed * 1.08 + 140.0);

            var activeIncidents = await _db.LeakageIncidents
                .Where(i => i.Status == IncidentStatus.Detected || i.Status == IncidentStatus.Acknowledged || i.Status == IncidentStatus.Assigned)
                .ToListAsync();

            int criticalCount = activeIncidents.Count(i => i.Severity == IncidentSeverity.Critical);
            double totalWaterLoss = await _db.LeakageIncidents.SumAsync(i => (double?)i.EstimatedWaterLostLitres) ?? 0.0;

            var sensors = await _db.Sensors.ToListAsync();
            int onlineSensors = sensors.Count(s => s.IsOnline);

            return Ok(new
            {
                total_water_supplied_litres = Math.Round(todaySupplied, 1),
                total_water_consumed_litres = Math.Round(todayConsumed, 1),
                current_total_flow_lpm = Math.Round(totalFlow, 1),
                average_pipeline_pressure_bar = Math.Round(avgPressure, 2),
                main_reservoir_level_pct = mainRes?.CurrentLevelPercentage ?? 0.0,
                main_reservoir_litres = mainRes?.CurrentLevelLitres ?? 0.0,
                overhead_tanks_average_pct = Math.Round(avgOhLevel, 1),
                active_leakage_incidents_count = activeIncidents.Count,
                critical_incidents_count = criticalCount,
                connected_sensors_count = onlineSensors,
                total_sensors_count = sensors.Count,
                isolated_valves_count = isolatedValves,
                estimated_water_wastage_litres = Math.Round(totalWaterLoss, 1),
                simulation_active = _simulator.IsRunning,
                active_anomaly_scenario = _simulator.ActiveScenario,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }

        [HttpGet("community")]
        public async Task<IActionResult> GetCommunity()
        {
            var community = await _db.Communities.FirstOrDefaultAsync();
            var buildings = await _db.Buildings
                .Include(b => b.Households)
                .Include(b => b.Pipelines)
                .Include(b => b.WaterTanks)
                .Include(b => b.LeakageIncidents)
                .ToListAsync();
            var tanks = await _db.WaterTanks.ToListAsync();

            var buildingData = new List<object>();

            foreach (var b in buildings)
            {
                var tank = tanks.FirstOrDefault(t => t.BuildingId == b.Id);
                int activeLeaks = b.LeakageIncidents.Count(i =>
                    i.Status == IncidentStatus.Detected ||
                    i.Status == IncidentStatus.Acknowledged ||
                    i.Status == IncidentStatus.Assigned);

                double cons = b.Households.Sum(h => h.CurrentDayUsageLitres);
                var pipeline = b.Pipelines.FirstOrDefault();
                double flow = pipeline?.CurrentFlowLpm ?? 0.0;

                buildingData.Add(new
                {
                    id = b.Id,
                    name = b.Name,
                    block_code = b.BlockCode,
                    total_households = b.TotalHouseholds,
                    today_consumption_litres = Math.Round(cons, 1),
                    current_flow_lpm = flow,
                    tank_name = tank?.Name ?? "Shared Main",
                    tank_level_pct = tank?.CurrentLevelPercentage,
                    active_leaks_count = activeLeaks
                });
            }

            return Ok(new
            {
                community_name = community?.Name ?? "GreenHeights Eco-Smart Community",
                total_capacity_litres = community?.TotalCapacityLitres ?? 140000.0,
                daily_budget_litres = community?.DailyBudgetLitres ?? 24000.0,
                buildings = buildingData,
                tanks = tanks.Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    type = t.TankType.ToString().ToLower(),
                    capacity_litres = t.CapacityLitres,
                    current_level_litres = t.CurrentLevelLitres,
                    current_level_percentage = t.CurrentLevelPercentage,
                    is_filling = t.IsFilling
                }).ToList()
            });
        }
    }
}
