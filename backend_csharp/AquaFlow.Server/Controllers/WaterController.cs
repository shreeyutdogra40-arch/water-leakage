using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AquaFlow.Server.Data;
using AquaFlow.Server.DTOs;
using AquaFlow.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AquaFlow.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WaterController : ControllerBase
    {
        private readonly AppDbContext _db;

        public WaterController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("tanks")]
        public async Task<ActionResult<List<TankDto>>> GetTanks()
        {
            var tanks = await _db.WaterTanks.ToListAsync();
            var dtos = tanks.Select(t => new TankDto
            {
                Id = t.Id,
                CommunityId = t.CommunityId,
                BuildingId = t.BuildingId,
                Name = t.Name,
                Type = t.TankType.ToString().ToLower(),
                CapacityLitres = t.CapacityLitres,
                CurrentLevelLitres = t.CurrentLevelLitres,
                CurrentLevelPercentage = t.CurrentLevelPercentage,
                HeightMeters = t.HeightMeters,
                LowLevelThresholdPct = t.LowLevelThresholdPct,
                IsFilling = t.IsFilling,
                UpdatedAt = t.UpdatedAt
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("supply")]
        public async Task<IActionResult> GetSupplyRecords([FromQuery] int limit = 30)
        {
            limit = Math.Clamp(limit, 1, 100);
            var records = await _db.WaterSupplyRecords
                .Include(r => r.Tank)
                .OrderByDescending(r => r.SupplyStart)
                .Take(limit)
                .ToListAsync();

            var results = records.Select(r => new
            {
                id = r.Id,
                community_id = r.CommunityId,
                tank_id = r.TankId,
                tank_name = r.Tank?.Name,
                supply_source = r.SupplySource,
                volume_supplied_litres = r.VolumeSuppliedLitres,
                supply_start = r.SupplyStart,
                supply_end = r.SupplyEnd,
                cost_estimate = r.CostEstimate,
                created_at = r.CreatedAt
            }).ToList();

            return Ok(results);
        }

        [HttpGet("buildings")]
        public async Task<ActionResult<List<BuildingSummaryDto>>> GetBuildings()
        {
            var buildings = await _db.Buildings
                .Include(b => b.Households)
                .Include(b => b.Pipelines)
                .Include(b => b.WaterTanks)
                .Include(b => b.LeakageIncidents)
                .ToListAsync();

            var results = buildings.Select(b =>
            {
                var tank = b.WaterTanks.FirstOrDefault();
                var pipeline = b.Pipelines.FirstOrDefault();
                double todayUsage = b.Households.Sum(h => h.CurrentDayUsageLitres);
                int activeLeaks = b.LeakageIncidents.Count(i =>
                    i.Status == IncidentStatus.Detected ||
                    i.Status == IncidentStatus.Acknowledged ||
                    i.Status == IncidentStatus.Assigned);

                return new BuildingSummaryDto
                {
                    Id = b.Id,
                    CommunityId = b.CommunityId,
                    Name = b.Name,
                    BlockCode = b.BlockCode,
                    TotalHouseholds = b.TotalHouseholds,
                    TodayConsumptionLitres = Math.Round(todayUsage, 1),
                    CurrentFlowLpm = pipeline?.CurrentFlowLpm ?? 0.0,
                    TankLevelPct = tank?.CurrentLevelPercentage,
                    TankName = tank?.Name,
                    ActiveLeaksCount = activeLeaks
                };
            }).ToList();

            return Ok(results);
        }

        [HttpGet("households")]
        public async Task<ActionResult<List<HouseholdDto>>> GetHouseholds([FromQuery] int? building_id = null)
        {
            var query = _db.Households.Include(h => h.Building).AsQueryable();

            if (building_id.HasValue)
            {
                query = query.Where(h => h.BuildingId == building_id.Value);
            }

            var households = await query.ToListAsync();

            var results = households.Select(h =>
            {
                double pct = h.DailyQuotaLitres > 0 ? (h.CurrentDayUsageLitres / h.DailyQuotaLitres * 100.0) : 0.0;
                return new HouseholdDto
                {
                    Id = h.Id,
                    BuildingId = h.BuildingId,
                    BuildingName = h.Building?.Name,
                    UnitNumber = h.UnitNumber,
                    ResidentName = h.ResidentName,
                    ContactPhone = h.ContactPhone,
                    MeterId = h.MeterId,
                    DailyQuotaLitres = h.DailyQuotaLitres,
                    CurrentDayUsageLitres = Math.Round(h.CurrentDayUsageLitres, 1),
                    QuotaUsagePercentage = Math.Round(pct, 1),
                    HasAnomaly = pct > 110.0
                };
            }).ToList();

            return Ok(results);
        }

        [HttpGet("my-consumption")]
        public async Task<IActionResult> GetMyConsumption()
        {
            string? username = User.Identity?.Name ?? User.FindFirst("sub")?.Value;
            User? user = null;

            if (!string.IsNullOrEmpty(username))
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
            }

            // Fallback: check resident user
            if (user == null || !user.HouseholdId.HasValue)
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.HouseholdId.HasValue);
            }

            if (user == null || !user.HouseholdId.HasValue)
            {
                return Ok(new
                {
                    household_id = (int?)null,
                    message = "User not assigned to a household meter.",
                    today_usage_litres = 0.0,
                    quota_litres = 600.0,
                    history = new object[0]
                });
            }

            var household = await _db.Households
                .Include(h => h.Building)
                .FirstOrDefaultAsync(h => h.Id == user.HouseholdId.Value);

            if (household == null)
            {
                return NotFound(new { detail = "Household record not found" });
            }

            var history = await _db.ConsumptionRecords
                .Where(c => c.HouseholdId == household.Id)
                .OrderByDescending(c => c.RecordDate)
                .Take(14)
                .ToListAsync();

            double quotaPct = household.DailyQuotaLitres > 0
                ? (household.CurrentDayUsageLitres / household.DailyQuotaLitres) * 100.0
                : 0.0;

            return Ok(new
            {
                household_id = household.Id,
                unit_number = household.UnitNumber,
                building_name = household.Building?.Name ?? "",
                resident_name = household.ResidentName,
                meter_id = household.MeterId,
                today_usage_litres = Math.Round(household.CurrentDayUsageLitres, 1),
                daily_quota_litres = household.DailyQuotaLitres,
                quota_percentage = Math.Round(quotaPct, 1),
                history = history.Select(h => new
                {
                    date = h.RecordDate.ToString("yyyy-MM-dd"),
                    volume_litres = h.VolumeConsumedLitres,
                    peak_flow = h.PeakFlowRate,
                    anomaly = h.AbnormalConsumptionDetected
                }).ToList()
            });
        }
    }
}
