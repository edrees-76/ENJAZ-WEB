using backend.Data;
using backend.Hubs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace backend.Services
{
    public interface IAlertService
    {
        Task<List<Alert>> GetActiveAlertsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task MarkAsReadAsync(int userId, int alertId);
        Task MarkAllAsReadAsync(int userId);
        
        // Background/Job Methods
        Task ProcessDelayedSamplesAlertsAsync();
        Task ResolveAlertsForSampleAsync(int receptionId);
    }

    public class AlertService : IAlertService
    {
        private readonly EnjazDbContext _db;
        private readonly ISettingsService _settings;
        private readonly ILogger<AlertService> _logger;
        private readonly IHubContext<AlertHub> _hubContext;

        /// <summary>حد أقصى للتنبيهات التي تُنشأ في دورة واحدة (Rate Limiting)</summary>
        private const int MaxAlertsPerCycle = 50;

        public AlertService(
            EnjazDbContext db, 
            ISettingsService settings, 
            ILogger<AlertService> logger,
            IHubContext<AlertHub> hubContext)
        {
            _db = db;
            _settings = settings;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<List<Alert>> GetActiveAlertsAsync(int userId)
        {
            // M2: استبعاد التنبيهات المحلولة + إزالة Include غير الضروري مع Select
            return await _db.UserAlerts
                .Where(ua => ua.UserId == userId && ua.Alert != null && !ua.Alert.IsResolved)
                .OrderByDescending(ua => ua.Alert!.CreatedAt)
                .Select(ua => ua.Alert!)
                .Take(20)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _db.UserAlerts
                .CountAsync(ua => ua.UserId == userId && !ua.IsRead);
        }

        public async Task MarkAsReadAsync(int userId, int alertId)
        {
            var userAlert = await _db.UserAlerts
                .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.AlertId == alertId);

            if (userAlert != null && !userAlert.IsRead)
            {
                userAlert.IsRead = true;
                userAlert.SeenAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await _db.UserAlerts
                .Where(ua => ua.UserId == userId && !ua.IsRead)
                .ToListAsync();

            foreach (var ua in unread)
            {
                ua.IsRead = true;
                ua.SeenAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
        }

        /// <summary>
        /// فحص العينات المتأخرة وتوليد تنبيهات برمجية لها
        /// C1: كل عملية إنشاء محمية بـ Transaction
        /// Rate Limiting: حد أقصى MaxAlertsPerCycle تنبيه لكل دورة
        /// </summary>
        public async Task ProcessDelayedSamplesAlertsAsync()
        {
            var settings = await _settings.GetSystemSettingsAsync();
            if (!settings.EnableAlerts) return;

            var thresholdDate = DateTime.UtcNow.AddDays(-settings.AlertThresholdDays);

            // العينات المتأخرة التي لم يصدر لها شهادة
            var delayedReceptions = await _db.SampleReceptions
                .Where(r => r.Date <= thresholdDate && r.Status == "لم يتم إصدار شهادة")
                .Take(MaxAlertsPerCycle) // Rate Limiting: لا تعالج أكثر من الحد
                .ToListAsync();

            int alertsCreated = 0;

            foreach (var reception in delayedReceptions)
            {
                // Rate Limiting check
                if (alertsCreated >= MaxAlertsPerCycle)
                {
                    _logger.LogWarning("Rate limit reached: {Max} alerts per cycle. Remaining will be processed next cycle.", MaxAlertsPerCycle);
                    break;
                }

                var daysPending = (int)(DateTime.UtcNow - reception.Date).TotalDays;
                var severity = CalculateSeverity(daysPending);
                var uniqueKey = $"DELAYED_SAMPLE:{reception.Id}";

                // منع التكرار (Idempotency)
                var existingAlert = await _db.Alerts.FirstOrDefaultAsync(a => a.UniqueKey == uniqueKey);

                if (existingAlert == null)
                {
                    // C1: Transaction Safety — حماية الإنشاء الكامل بمعاملة واحدة مع Retry Policy
                    var strategy = _db.Database.CreateExecutionStrategy();
                    
                    await strategy.ExecuteAsync(async () =>
                    {
                        using var transaction = await _db.Database.BeginTransactionAsync();
                        try
                        {
                            var newAlert = new Alert
                            {
                                Type = "DelayedSample",
                                EntityId = reception.Id,
                                Severity = severity,
                                Title = $"عينة متأخرة: {reception.AnalysisRequestNumber}",
                                Message = $"هذه العينة معلقة منذ {daysPending} يوماً. يرجى مراجعة الإجراءات.",
                                UniqueKey = uniqueKey,
                                CreatedAt = DateTime.UtcNow
                            };

                            _db.Alerts.Add(newAlert);

                            // ربط التنبيه بجميع المستخدمين النشطين
                            var users = await _db.Users.Where(u => u.IsActive).ToListAsync();
                            
                            _db.UserAlerts.AddRange(users.Select(u => new UserAlert
                            {
                                UserId = u.Id,
                                AlertId = newAlert.Id
                            }));

                            await _db.SaveChangesAsync();
                            await transaction.CommitAsync();

                            alertsCreated++;
                            _logger.LogWarning("تنبيه جديد: {UniqueKey} — خطورة: {Severity}", uniqueKey, severity);

                            // M3: إرسال SignalR بالتوازي باستخدام Task.WhenAll
                            await Task.WhenAll(users.Select(async user =>
                            {
                                try
                                {
                                    await _hubContext.Clients.User(user.Id.ToString())
                                        .SendAsync("NotificationReceived", new
                                        {
                                            type = "NEW_ALERT",
                                            alertId = newAlert.Id,
                                            severity = (int)newAlert.Severity
                                        });
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "فشل إرسال إشعار SignalR للمستخدم {UserId}", user.Id);
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, "فشل إنشاء تنبيه: {UniqueKey}", uniqueKey);
                            // لا نرمي الاستثناء — نكمل معالجة باقي العينات
                        }
                    });
                }
                else if (existingAlert.IsResolved)
                {
                    // إعادة فتح التنبيه إذا عادت المشكلة
                    existingAlert.IsResolved = false;
                    existingAlert.ResolvedAt = null;
                    existingAlert.Severity = severity;
                    await _db.SaveChangesAsync();
                    _logger.LogWarning("إعادة فتح تنبيه: {UniqueKey}", uniqueKey);
                }
            }

            if (alertsCreated > 0)
            {
                _logger.LogInformation("تم إنشاء {Count} تنبيه(ات) جديدة في هذه الدورة.", alertsCreated);
            }
        }

        public async Task ResolveAlertsForSampleAsync(int receptionId)
        {
            var uniqueKey = $"DELAYED_SAMPLE:{receptionId}";
            var alert = await _db.Alerts.FirstOrDefaultAsync(a => a.UniqueKey == uniqueKey);
            
            if (alert != null && !alert.IsResolved)
            {
                alert.IsResolved = true;
                alert.ResolvedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _logger.LogInformation("تم حل التنبيه: {UniqueKey}", uniqueKey);
            }
        }

        private AlertSeverity CalculateSeverity(int days)
        {
            if (days > 15) return AlertSeverity.Critical;
            if (days > 7) return AlertSeverity.Warning;
            return AlertSeverity.Info;
        }
    }
}
