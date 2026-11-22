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
    public class PipelinesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PipelinesController(AppDbContext db)
        {
            _db = db;
        }

        private static PipelineDto MapToDto(Pipeline p)
        {
            return new PipelineDto
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
            };
        }

        [HttpGet]
        public async Task<ActionResult<List<PipelineDto>>> GetPipelines()
        {
            var pipelines = await _db.Pipelines.ToListAsync();
            return Ok(pipelines.Select(MapToDto).ToList());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PipelineDto>> GetPipeline(int id)
        {
            var pipeline = await _db.Pipelines.FindAsync(id);
            if (pipeline == null)
            {
                return NotFound(new { detail = "Pipeline not found" });
            }
            return Ok(MapToDto(pipeline));
        }

        [HttpPost]
        public async Task<ActionResult<PipelineDto>> CreatePipeline([FromBody] PipelineCreateDto dto)
        {
            var existing = await _db.Pipelines.FirstOrDefaultAsync(p => p.Code == dto.Code);
            if (existing != null)
            {
                return BadRequest(new { detail = "Pipeline code already exists" });
            }

            var pipeline = new Pipeline
            {
                CommunityId = dto.CommunityId,
                BuildingId = dto.BuildingId,
                Name = dto.Name,
                Code = dto.Code,
                Material = dto.Material,
                DiameterMm = dto.DiameterMm,
                MaxPressureBar = dto.MaxPressureBar,
                NominalPressureBar = dto.NominalPressureBar,
                NormalFlowLpm = dto.NormalFlowLpm,
                ValveStatus = ValveStatus.Open,
                IsIsolated = false,
                CurrentFlowLpm = dto.NormalFlowLpm,
                CurrentPressureBar = dto.NominalPressureBar,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Pipelines.Add(pipeline);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPipeline), new { id = pipeline.Id }, MapToDto(pipeline));
        }
    }
}
