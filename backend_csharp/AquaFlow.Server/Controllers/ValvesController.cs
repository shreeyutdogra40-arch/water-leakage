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
    public class ValvesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly AutomationService _automation;

        public ValvesController(AppDbContext db, AutomationService automation)
        {
            _db = db;
            _automation = automation;
        }

        [HttpPost("{id}/control")]
        public async Task<ActionResult<PipelineDto>> ControlValve(int id, [FromBody] ValveControlDto req)
        {
            string? username = User.Identity?.Name ?? User.FindFirst("sub")?.Value;
            var user = !string.IsNullOrEmpty(username)
                ? await _db.Users.FirstOrDefaultAsync(u => u.Username == username)
                : await _db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);

            try
            {
                var pipeline = _automation.ControlValve(_db, id, req.Action, req.Reason, user);
                return Ok(new PipelineDto
                {
                    Id = pipeline.Id,
                    CommunityId = pipeline.CommunityId,
                    BuildingId = pipeline.BuildingId,
                    Name = pipeline.Name,
                    Code = pipeline.Code,
                    Material = pipeline.Material,
                    DiameterMm = pipeline.DiameterMm,
                    MaxPressureBar = pipeline.MaxPressureBar,
                    NominalPressureBar = pipeline.NominalPressureBar,
                    NormalFlowLpm = pipeline.NormalFlowLpm,
                    ValveStatus = pipeline.ValveStatus.ToString().ToLower(),
                    IsIsolated = pipeline.IsIsolated,
                    CurrentFlowLpm = pipeline.CurrentFlowLpm,
                    CurrentPressureBar = pipeline.CurrentPressureBar,
                    UpdatedAt = pipeline.UpdatedAt
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { detail = ex.Message });
            }
        }

        [HttpGet("{id}/status")]
        public async Task<IActionResult> GetValveStatus(int id)
        {
            var pipeline = await _db.Pipelines.FindAsync(id);
            if (pipeline == null)
            {
                return NotFound(new { detail = "Pipeline not found" });
            }

            return Ok(new
            {
                pipeline_id = pipeline.Id,
                pipeline_code = pipeline.Code,
                valve_status = pipeline.ValveStatus.ToString().ToLower(),
                is_isolated = pipeline.IsIsolated,
                current_flow_lpm = pipeline.CurrentFlowLpm,
                current_pressure_bar = pipeline.CurrentPressureBar,
                last_action_at = pipeline.UpdatedAt.ToString("o")
            });
        }

        [HttpGet("actions/log")]
        public async Task<ActionResult<List<ValveActionDto>>> GetValveActionsLog([FromQuery] int limit = 50)
        {
            limit = Math.Clamp(limit, 1, 200);
            var actions = await _db.ValveActions
                .Include(a => a.Pipeline)
                .Include(a => a.TriggeredByUser)
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToListAsync();

            var dtos = actions.Select(a => new ValveActionDto
            {
                Id = a.Id,
                PipelineId = a.PipelineId,
                PipelineName = a.Pipeline?.Name,
                TriggeredByUserId = a.TriggeredByUserId,
                TriggeredByName = a.TriggeredByUser?.FullName,
                ActionType = a.ActionType.ToString().ToLower(),
                Reason = a.Reason,
                PreviousStatus = a.PreviousStatus,
                NewStatus = a.NewStatus,
                Timestamp = a.Timestamp
            }).ToList();

            return Ok(dtos);
        }
    }
}
