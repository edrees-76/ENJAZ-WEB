using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    // ═══════════════════════════════════════════════
    // Interface
    // ═══════════════════════════════════════════════

    public interface IAuditLogService
    {
        Task LogAsync(int? userId, string? userName, string action, string? details = null,
            int? referenceId = null, string? ipAddress = null, string? userAgent = null);
        Task<List<AuditLogDto>> GetLogsAsync(AuditLogFilterDto filter);
        Task<AuditLogStatsDto> GetTodayStatsAsync();
    }

    // ═══════════════════════════════════════════════
    // Implementation
    // ═══════════════════════════════════════════════

    public class AuditLogService : IAuditLogService
    {
        private readonly EnjazDbContext _db;

        public AuditLogService(EnjazDbContext db)
        {
            _db = db;
        }

        public async Task LogAsync(int? userId, string? userName, string action,
            string? details = null, int? referenceId = null,
            string? ipAddress = null, string? userAgent = null)
        {
            var log = new AuditLog
            {
                UserId = userId,
                UserName = userName,
                Action = action,
                Details = details,
                ReferenceId = referenceId,
                IpAddress = ipAddress,
                UserAgent = userAgent?.Length > 300 ? userAgent[..300] : userAgent,
                Timestamp = DateTime.UtcNow
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }

        public async Task<List<AuditLogDto>> GetLogsAsync(AuditLogFilterDto filter)
        {
            var query = _db.AuditLogs.AsQueryable();

            if (filter.UserId.HasValue)
                query = query.Where(a => a.UserId == filter.UserId.Value);

            if (filter.StartDate.HasValue)
                query = query.Where(a => a.Timestamp >= filter.StartDate.Value);

            if (filter.EndDate.HasValue)
                query = query.Where(a => a.Timestamp < filter.EndDate.Value.AddDays(1));

            return await query
                .OrderByDescending(a => a.Id)
                .Take(filter.Limit)
                .Select(a => AuditLogDto.FromEntity(a))
                .ToListAsync();
        }

        public async Task<AuditLogStatsDto> GetTodayStatsAsync()
        {
            var todayUtc = DateTime.UtcNow.Date;

            var todayLogs = await _db.AuditLogs
                .Where(a => a.Timestamp >= todayUtc)
                .ToListAsync();

            var mostActive = todayLogs
                .Where(a => a.UserName != null)
                .GroupBy(a => a.UserName)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .FirstOrDefault();

            var modifications = todayLogs
                .Count(a => a.Action.Contains("تعديل") || a.Action.Contains("حذف")
                         || a.Action.Contains("إضافة") || a.Action.Contains("تجميد")
                         || a.Action.Contains("استلام") || a.Action.Contains("إصدار"));

            return new AuditLogStatsDto
            {
                ActivitiesToday = todayLogs.Count,
                ModificationsToday = modifications,
                MostActiveUser = mostActive
            };
        }
    }
}
