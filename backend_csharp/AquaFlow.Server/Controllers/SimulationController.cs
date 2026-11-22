using System;
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
    public class SimulationController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IoTSimulatorBackgroundService _simulator;

        public SimulationController(AppDbContext db, IoTSimulatorBackgroundService simulator)
        {
            _db = db;
            _simulator = simulator;
        }

        [HttpGet("state")]
        public IActionResult GetState()
        {
            return Ok(new
            {
                is_running = _simulator.IsRunning,
                active_scenario = _simulator.ActiveScenario,
                target_pipeline_id = _simulator.TargetPipelineId,
                ticks_generated = _simulator.TickCounter
            });
        }

        [HttpPost("toggle")]
        public IActionResult Toggle()
        {
            _simulator.IsRunning = !_simulator.IsRunning;
            return Ok(new { is_running = _simulator.IsRunning });
        }

        [HttpPost("inject")]
        public IActionResult Inject([FromBody] SimulationInjectDto req)
        {
            var validScenarios = new[] { "pipe_burst", "micro_leak", "pressure_drop", "sensor_offline", "tank_drain" };
            if (!validScenarios.Contains(req.Scenario))
            {
                return BadRequest(new
                {
                    detail = $"Invalid scenario '{req.Scenario}'. Allowed: {string.Join(", ", validScenarios)}"
                });
            }

            _simulator.IsRunning = true;
            _simulator.InjectScenario(req.Scenario, req.PipelineId);

            return Ok(new
            {
                status = "success",
                scenario = req.Scenario,
                target_pipeline_id = req.PipelineId,
                message = $"Simulated {req.Scenario} anomaly is now live in hydraulic engine."
            });
        }

        [HttpPost("reset")]
        public async Task<IActionResult> Reset()
        {
            _simulator.ResetScenarios(_db);

            var pipelines = await _db.Pipelines.ToListAsync();
            foreach (var p in pipelines)
            {
                p.ValveStatus = ValveStatus.Open;
                p.IsIsolated = false;
                p.CurrentFlowLpm = p.NormalFlowLpm;
                p.CurrentPressureBar = p.NominalPressureBar;
                p.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Hydraulic simulation state reset to nominal operating parameters." });
        }
    }
}
