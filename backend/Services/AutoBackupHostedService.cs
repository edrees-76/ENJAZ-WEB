using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    /// <summary>
    /// خدمة النسخ الاحتياطي التلقائي — تعمل في الخلفية وتتحقق كل ساعة
    /// تستخدم DB Lock لمنع التنفيذ المزدوج عند إعادة تشغيل الخادم
    /// </summary>
    public class AutoBackupHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoBackupHostedService> _logger;
        private const string LOCK_NAME = "AutoBackup";
        private const string BACKUP_DIR = "backups/auto";
        private const int MAX_BACKUPS = 10;

        public AutoBackupHostedService(
            IServiceScopeFactory scopeFactory,
            ILogger<AutoBackupHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoBackup service started");

            // Wait 30 seconds after startup before first check
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndPerformBackupAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Auto backup check failed");
                }

                // Check every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }

            _logger.LogInformation("AutoBackup service stopped");
        }

        private async Task CheckAndPerformBackupAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var settingsService = scope.ServiceProvider.GetRequiredService<ISettingsService>();

            // 1. Check if auto backup is enabled
            var settings = await settingsService.GetSystemSettingsAsync();
            if (!settings.AutoBackupEnabled)
            {
                return;
            }

            // 2. Check if enough time has passed
            var interval = settings.BackupFrequency switch
            {
                "daily" => TimeSpan.FromHours(24),
                "weekly" => TimeSpan.FromDays(7),
                "monthly" => TimeSpan.FromDays(30),
                _ => TimeSpan.FromHours(24)
            };

            if (settings.LastBackupDate.HasValue &&
                DateTime.UtcNow - settings.LastBackupDate.Value < interval)
            {
                return; // Not time yet
            }

            // 3. Acquire lock (prevent duplicate execution)
            if (!await settingsService.AcquireLockAsync(LOCK_NAME, TimeSpan.FromMinutes(30)))
            {
                _logger.LogInformation("AutoBackup skipped — lock held by another process");
                return;
            }

            try
            {
                _logger.LogInformation("Starting automatic backup...");

                // 4. Perform backup (use a system key for auto-backups)
                var backupData = await settingsService.ExportBackupAsync("__auto_backup_key__");

                // 5. Save to file
                var backupDir = Path.Combine(AppContext.BaseDirectory, BACKUP_DIR);
                Directory.CreateDirectory(backupDir);

                var fileName = $"enjaz_auto_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.bak";
                var filePath = Path.Combine(backupDir, fileName);

                await File.WriteAllBytesAsync(filePath, backupData, ct);

                // 6. Update last backup date
                await settingsService.UpdateSystemSettingsAsync(new SystemSettingsUpdateDto());
                var sysSettings = await settingsService.GetSystemSettingsAsync();
                sysSettings.LastBackupDate = DateTime.UtcNow;

                // Save via direct context since UpdateSystemSettingsAsync doesn't update LastBackupDate
                using var innerScope = _scopeFactory.CreateScope();
                var db = innerScope.ServiceProvider.GetRequiredService<Data.EnjazDbContext>();
                var dbSettings = await db.SystemSettings.FirstAsync(ct);
                dbSettings.LastBackupDate = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);

                // 7. Cleanup old backups (keep only MAX_BACKUPS)
                CleanupOldBackups(backupDir);

                _logger.LogInformation("Automatic backup completed: {Path}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Automatic backup failed");
            }
            finally
            {
                await settingsService.ReleaseLockAsync(LOCK_NAME);
            }
        }

        private void CleanupOldBackups(string directory)
        {
            try
            {
                var files = Directory.GetFiles(directory, "enjaz_auto_*.bak")
                    .OrderByDescending(f => f)
                    .Skip(MAX_BACKUPS)
                    .ToList();

                foreach (var file in files)
                {
                    File.Delete(file);
                    _logger.LogInformation("Deleted old backup: {File}", Path.GetFileName(file));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup old backups");
            }
        }
    }
}
