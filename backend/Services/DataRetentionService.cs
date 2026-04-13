using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    /// <summary>
    /// Core-A M2: Hangfire recurring job for data retention.
    /// - Archives AuditLogs older than 6 months (batch 1000)
    /// - Cleans expired RefreshTokens
    /// - Runs daily at 3:00 AM
    /// </summary>
    public interface IDataRetentionService
    {
        Task CleanupAuditLogsAsync(CancellationToken ct = default);
        Task CleanupExpiredTokensAsync(CancellationToken ct = default);
        Task RunFullCleanupAsync(CancellationToken ct = default);
    }

    public class DataRetentionService : IDataRetentionService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DataRetentionService> _logger;
        private const int BatchSize = 1000;
        private const int RetentionMonths = 6;

        public DataRetentionService(
            IServiceScopeFactory scopeFactory,
            ILogger<DataRetentionService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Archives (marks) AuditLogs older than 6 months.
        /// Processes in batches of 1000 for memory efficiency.
        /// </summary>
        public async Task CleanupAuditLogsAsync(CancellationToken ct = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EnjazDbContext>();

            var cutoffDate = DateTime.UtcNow.AddMonths(-RetentionMonths);
            var totalArchived = 0;

            while (!ct.IsCancellationRequested)
            {
                var batch = await db.AuditLogs
                    .Where(a => !a.IsArchived && a.Timestamp < cutoffDate)
                    .OrderBy(a => a.Id)
                    .Take(BatchSize)
                    .ToListAsync(ct);

                if (batch.Count == 0) break;

                foreach (var log in batch)
                {
                    log.IsArchived = true;
                }

                await db.SaveChangesAsync(ct);
                totalArchived += batch.Count;

                _logger.LogInformation(
                    "DataRetention: Archived {Count} audit logs (batch), total so far: {Total}",
                    batch.Count, totalArchived);
            }

            if (totalArchived > 0)
            {
                _logger.LogInformation(
                    "DataRetention: Completed — archived {Total} audit logs older than {Months} months",
                    totalArchived, RetentionMonths);
            }
            else
            {
                _logger.LogDebug("DataRetention: No audit logs to archive");
            }
        }

        /// <summary>
        /// Removes expired and revoked RefreshTokens to prevent unbounded growth.
        /// </summary>
        public async Task CleanupExpiredTokensAsync(CancellationToken ct = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EnjazDbContext>();

            var now = DateTime.UtcNow;
            var deleted = await db.RefreshTokens
                .Where(t => t.ExpiresAt < now || t.IsRevoked)
                .ExecuteDeleteAsync(ct);

            if (deleted > 0)
            {
                _logger.LogInformation(
                    "DataRetention: Cleaned up {Count} expired/revoked refresh tokens", deleted);
            }
        }

        /// <summary>
        /// Full cleanup — called by Hangfire daily.
        /// </summary>
        public async Task RunFullCleanupAsync(CancellationToken ct = default)
        {
            _logger.LogInformation("DataRetention: Starting daily cleanup job");

            try
            {
                await CleanupExpiredTokensAsync(ct);
                await CleanupAuditLogsAsync(ct);

                _logger.LogInformation("DataRetention: Daily cleanup completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DataRetention: Cleanup job failed");
                throw; // Let Hangfire handle retry
            }
        }
    }
}
