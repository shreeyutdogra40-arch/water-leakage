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
    public class AlertsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AlertsController(AppDbContext db)
        {
            _db = db;
        }

        private static NotificationDto MapToDto(Notification n)
        {
            return new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                IncidentId = n.IncidentId,
                Title = n.Title,
                Message = n.Message,
                AlertType = n.AlertType.ToString().ToLower(),
                Severity = n.Severity.ToString().ToLower(),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            };
        }

        [HttpGet]
        public async Task<ActionResult<List<NotificationDto>>> GetAlerts(
            [FromQuery] bool unread_only = false,
            [FromQuery] int limit = 50)
        {
            limit = Math.Clamp(limit, 1, 100);
            var query = _db.Notifications.AsQueryable();

            if (unread_only)
            {
                query = query.Where(n => !n.IsRead);
            }

            var alerts = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return Ok(alerts.Select(MapToDto).ToList());
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int count = await _db.Notifications.CountAsync(n => !n.IsRead);
            return Ok(new { unread_count = count });
        }

        [HttpPatch("{id}/read")]
        public async Task<ActionResult<NotificationDto>> MarkRead(int id)
        {
            var alert = await _db.Notifications.FindAsync(id);
            if (alert == null)
            {
                return NotFound(new { detail = "Alert not found" });
            }

            alert.IsRead = true;
            await _db.SaveChangesAsync();

            return Ok(MapToDto(alert));
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var unread = await _db.Notifications.Where(n => !n.IsRead).ToListAsync();
            foreach (var a in unread)
            {
                a.IsRead = true;
            }
            await _db.SaveChangesAsync();

            return Ok(new { status = "ok", message = "All alerts marked as read" });
        }
    }
}
