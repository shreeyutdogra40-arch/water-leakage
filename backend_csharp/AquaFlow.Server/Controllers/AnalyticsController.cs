using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using AquaFlow.Server.Data;
using AquaFlow.Server.DTOs;
using AquaFlow.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquaFlow.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly AnalyticsService _analytics;

        public AnalyticsController(AppDbContext db, AnalyticsService analytics)
        {
            _db = db;
            _analytics = analytics;
        }

        [HttpGet("consumption")]
        public ActionResult<List<DailyConsumptionPointDto>> GetConsumptionTrend([FromQuery] int days = 14)
        {
            days = Math.Clamp(days, 3, 90);
            return Ok(_analytics.GetConsumptionTrend(_db, days));
        }

        [HttpGet("buildings")]
        public ActionResult<List<BuildingComparisonDto>> GetBuildingComparisons()
        {
            return Ok(_analytics.GetBuildingComparisons(_db));
        }

        [HttpGet("wastage")]
        public ActionResult<WastageAnalysisDto> GetWastageAnalysis([FromQuery] int days = 30)
        {
            days = Math.Clamp(days, 7, 180);
            return Ok(_analytics.GetWastageAnalysis(_db, days));
        }

        [HttpGet("leakage")]
        public ActionResult<IncidentStatsDto> GetLeakageStats()
        {
            return Ok(_analytics.GetIncidentStats(_db));
        }

        [HttpGet("export")]
        public IActionResult ExportCsvReport([FromQuery] int days = 30)
        {
            days = Math.Clamp(days, 7, 180);
            var csv = _analytics.ExportCsvReport(_db, days);
            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", "water_analytics_report.csv");
        }
    }
}
