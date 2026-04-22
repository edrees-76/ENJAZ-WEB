using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace backend.Services
{
    // ═══════════════════════════════════════════════
    // Interface
    // ═══════════════════════════════════════════════

    public interface ISettingsService
    {
        // System Settings
        Task<SystemSettings> GetSystemSettingsAsync();
        Task<SystemSettings> UpdateSystemSettingsAsync(SystemSettingsUpdateDto dto);

        // User Settings
        Task<UserSettings> GetUserSettingsAsync(int userId);
        Task<UserSettings> UpdateUserSettingsAsync(int userId, UserSettingsUpdateDto dto);

        // Backup & Restore
        Task<byte[]> ExportBackupAsync(string adminPassword);
        Task<BackupValidationResult> ValidateBackupAsync(Stream fileStream, string password);
        Task RestoreBackupAsync(Stream fileStream, string password);

        // Archive
        Task<int> ArchiveLogsAsync(int months);

        // Reset
        Task SoftResetAsync();
        Task HardResetAsync(int currentUserId);

        // Maintenance Mode
        Task SetMaintenanceModeAsync(bool enabled);
        Task<bool> IsMaintenanceModeAsync();

        // Locks
        Task<bool> AcquireLockAsync(string name, TimeSpan duration);
        Task ReleaseLockAsync(string name);

        // Alerts
        Task<List<AlertDto>> GetPendingAlertsAsync();
    }

    // ═══════════════════════════════════════════════
    // DTOs
    // ═══════════════════════════════════════════════

    public class SystemSettingsUpdateDto
    {
        public bool? EnableAlerts { get; set; }
        public int? AlertThresholdDays { get; set; }
        public bool? AutoBackupEnabled { get; set; }
        public string? BackupFrequency { get; set; }
    }

    public class UserSettingsUpdateDto
    {
        public bool? IsDarkMode { get; set; }
        public double? FontSizeScale { get; set; }
    }

    public class BackupValidationResult
    {
        public bool IsValid { get; set; }
        public string? Error { get; set; }
        public string? SchemaVersion { get; set; }
        public string? AppVersion { get; set; }
        public DateTime? ExportDate { get; set; }
        public string? ExportedBy { get; set; }
        public Dictionary<string, int> RecordCounts { get; set; } = new();
    }

    public class AlertDto
    {
        public int ReceptionId { get; set; }
        public string? ReceptionNumber { get; set; }
        public string? Sender { get; set; }
        public DateTime ReceivedDate { get; set; }
        public int DaysPending { get; set; }
    }

    // ═══════════════════════════════════════════════
    // Backup Data Model (JSON structure for deserialization)
    // ═══════════════════════════════════════════════

    internal class BackupEnvelope
    {
        public string SchemaVersion { get; set; } = "";
        public string AppVersion { get; set; } = "";
        public DateTime ExportDate { get; set; }
        public string ExportedBy { get; set; } = "";
        public JsonElement Data { get; set; }
        public string Checksum { get; set; } = "";
    }

    // ═══════════════════════════════════════════════
    // Implementation
    // ═══════════════════════════════════════════════

    public class SettingsService : ISettingsService
    {
        private readonly EnjazDbContext _db;
        private readonly ILogger<SettingsService> _logger;
        private const string CURRENT_SCHEMA_VERSION = "2026.04.11";

        public SettingsService(EnjazDbContext db, ILogger<SettingsService> logger)
        {
            _db = db;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════
        // System Settings
        // ═══════════════════════════════════════════════

        public async Task<SystemSettings> GetSystemSettingsAsync()
        {
            var settings = await _db.SystemSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new SystemSettings();
                _db.SystemSettings.Add(settings);
                await _db.SaveChangesAsync();
            }
            return settings;
        }

        public async Task<SystemSettings> UpdateSystemSettingsAsync(SystemSettingsUpdateDto dto)
        {
            var settings = await GetSystemSettingsAsync();

            if (dto.EnableAlerts.HasValue) settings.EnableAlerts = dto.EnableAlerts.Value;
            if (dto.AlertThresholdDays.HasValue) settings.AlertThresholdDays = dto.AlertThresholdDays.Value;
            if (dto.AutoBackupEnabled.HasValue) settings.AutoBackupEnabled = dto.AutoBackupEnabled.Value;
            if (!string.IsNullOrWhiteSpace(dto.BackupFrequency)) settings.BackupFrequency = dto.BackupFrequency;

            settings.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return settings;
        }

        // ═══════════════════════════════════════════════
        // User Settings
        // ═══════════════════════════════════════════════

        public async Task<UserSettings> GetUserSettingsAsync(int userId)
        {
            var settings = await _db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
            if (settings == null)
            {
                settings = new UserSettings { UserId = userId };
                _db.UserSettings.Add(settings);
                await _db.SaveChangesAsync();
            }
            return settings;
        }

        public async Task<UserSettings> UpdateUserSettingsAsync(int userId, UserSettingsUpdateDto dto)
        {
            var settings = await GetUserSettingsAsync(userId);

            if (dto.IsDarkMode.HasValue) settings.IsDarkMode = dto.IsDarkMode.Value;
            if (dto.FontSizeScale.HasValue) settings.FontSizeScale = dto.FontSizeScale.Value;

            settings.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return settings;
        }

        // ═══════════════════════════════════════════════
        // Backup Export (JSON flat + AES-256-CBC + PBKDF2)
        // ═══════════════════════════════════════════════

        public async Task<byte[]> ExportBackupAsync(string adminPassword)
        {
            _logger.LogInformation("Starting backup export...");

            // Load each table independently WITHOUT navigation properties to prevent circular references
            var sampleReceptions = await _db.SampleReceptions.AsNoTracking().ToListAsync();
            var receptionSamples = await _db.ReceptionSamples.AsNoTracking().ToListAsync();
            var certificates = await _db.Certificates.AsNoTracking().ToListAsync();
            var samples = await _db.Samples.AsNoTracking().ToListAsync();
            var referralLetters = await _db.ReferralLetters.AsNoTracking().IgnoreQueryFilters().ToListAsync();
            var referralCerts = await _db.ReferralLetterCertificates.AsNoTracking().ToListAsync();
            var users = await _db.Users.AsNoTracking().ToListAsync();
            var auditLogs = await _db.AuditLogs.AsNoTracking().ToListAsync();

            // Build a flat backup object (no navigation properties)
            var backupObj = new
            {
                SchemaVersion = CURRENT_SCHEMA_VERSION,
                AppVersion = "2.0.0",
                ExportDate = DateTime.UtcNow,
                ExportedBy = "",
                Data = new
                {
                    SampleReceptions = sampleReceptions.Select(r => new { r.Id, r.Sequence, r.AnalysisRequestNumber, r.NotificationNumber, r.DeclarationNumber, r.Supplier, r.Sender, r.Origin, r.PolicyNumber, r.FinancialReceiptNumber, r.CertificateType, r.Date, r.Status, r.CreatedBy, r.CreatedByName, r.CreatedAt, r.UpdatedBy, r.UpdatedByName, r.UpdatedAt }),
                    ReceptionSamples = receptionSamples.Select(s => new { s.Id, s.SampleReceptionId, s.SampleNumber, s.Description, s.Root }),
                    Certificates = certificates.Select(c => new { c.Id, c.CertificateNumber, c.RecipientName, c.CertificateType, c.AnalysisType, c.Sender, c.Supplier, c.Origin, c.NotificationNumber, c.DeclarationNumber, c.PolicyNumber, c.FinancialReceiptNumber, c.Description, c.IssuingAuthority, c.IssueDate, c.ExpiryDate, c.SpecialistName, c.SectionHeadName, c.ManagerName, c.Notes, c.SampleReceptionId, c.CreatedBy, c.CreatedByName, c.CreatedAt }),
                    Samples = samples.Select(s => new { s.Id, s.CertificateId, s.SampleNumber, s.Description, s.Root, s.Result, s.MeasurementDate, s.IsotopeCs137, s.IsotopeK40, s.IsotopeRa, s.IsotopeRa226, s.IsotopeTh232 }),
                    ReferralLetters = referralLetters.Select(r => new { r.Id, r.ReferenceNumber, r.SenderName, r.StartDate, r.EndDate, r.CertificateCount, r.SampleCount, r.IncludedColumns, r.GeneratedAt, r.CreatedByName, r.PdfPath, r.TemplateVersion, r.IsDeleted }),
                    ReferralLetterCertificates = referralCerts.Select(c => new { c.Id, c.ReferralLetterId, c.CertificateId }),
                    Users = users.Select(u => new { u.Id, u.Username, u.PasswordHash, u.FullName, u.Role, u.Specialization, u.IsEditor, u.IsActive, u.Permissions, u.CreatedAt }),
                    AuditLogs = auditLogs.Select(a => new { a.Id, a.UserId, a.UserName, a.Action, a.Details, a.ReferenceId, a.Timestamp, a.IpAddress, a.UserAgent, a.IsArchived })
                },
                Checksum = ""
            };

            var jsonOptions = new JsonSerializerOptions { WriteIndented = true };

            // Compute checksum on data section
            var dataJson = JsonSerializer.Serialize(backupObj.Data, jsonOptions);
            var checksum = ComputeSha256(dataJson);

            // Re-create with checksum
            var finalBackup = new
            {
                backupObj.SchemaVersion,
                backupObj.AppVersion,
                backupObj.ExportDate,
                backupObj.ExportedBy,
                backupObj.Data,
                Checksum = checksum
            };

            var fullJson = JsonSerializer.Serialize(finalBackup, jsonOptions);

            _logger.LogInformation("Backup JSON generated, size: {Size} bytes. Encrypting...", fullJson.Length);

            // Encrypt with PBKDF2-derived key
            return EncryptWithPassword(Encoding.UTF8.GetBytes(fullJson), adminPassword);
        }

        // ═══════════════════════════════════════════════
        // Backup Validation (Dry-run)
        // ═══════════════════════════════════════════════

        public async Task<BackupValidationResult> ValidateBackupAsync(Stream fileStream, string password)
        {
            var result = new BackupValidationResult();

            try
            {
                using var ms = new MemoryStream();
                await fileStream.CopyToAsync(ms);
                var encrypted = ms.ToArray();

                // Decrypt
                byte[] decrypted;
                try
                {
                    decrypted = DecryptWithPassword(encrypted, password);
                }
                catch
                {
                    result.Error = "كلمة المرور غير صحيحة أو الملف تالف";
                    return result;
                }

                var json = Encoding.UTF8.GetString(decrypted);
                var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                opts.Converters.Add(new UtcDateTimeConverter());
                opts.Converters.Add(new NullableUtcDateTimeConverter());
                var envelope = JsonSerializer.Deserialize<BackupEnvelope>(json, opts);

                if (envelope == null)
                {
                    result.Error = "تنسيق الملف غير صالح";
                    return result;
                }

                // Schema version check
                if (envelope.SchemaVersion != CURRENT_SCHEMA_VERSION)
                {
                    result.Error = $"إصدار المخطط غير متوافق. الملف: {envelope.SchemaVersion}، النظام: {CURRENT_SCHEMA_VERSION}";
                    return result;
                }

                // Count records from JsonElement
                int CountArray(string name) =>
                    envelope.Data.TryGetProperty(name, out var arr) ? arr.GetArrayLength() : 0;

                result.IsValid = true;
                result.SchemaVersion = envelope.SchemaVersion;
                result.AppVersion = envelope.AppVersion;
                result.ExportDate = envelope.ExportDate;
                result.ExportedBy = envelope.ExportedBy;
                result.RecordCounts = new Dictionary<string, int>
                {
                    ["سجلات الاستلام"] = CountArray("SampleReceptions"),
                    ["عينات الاستلام"] = CountArray("ReceptionSamples"),
                    ["الشهادات"] = CountArray("Certificates"),
                    ["العينات"] = CountArray("Samples"),
                    ["خطابات الإحالة"] = CountArray("ReferralLetters"),
                    ["المستخدمين"] = CountArray("Users"),
                    ["سجلات النشاط"] = CountArray("AuditLogs")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Backup validation failed");
                result.Error = $"خطأ في تحليل الملف: {ex.Message}";
            }

            return result;
        }

        // ═══════════════════════════════════════════════
        // Restore (Clear + Re-insert)
        // ═══════════════════════════════════════════════

        public async Task RestoreBackupAsync(Stream fileStream, string password)
        {
            using var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms);
            var encrypted = ms.ToArray();

            var decrypted = DecryptWithPassword(encrypted, password);
            var json = Encoding.UTF8.GetString(decrypted);

            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            opts.Converters.Add(new UtcDateTimeConverter());
            opts.Converters.Add(new NullableUtcDateTimeConverter());
            var envelope = JsonSerializer.Deserialize<BackupEnvelope>(json, opts)
                ?? throw new InvalidOperationException("تنسيق الملف غير صالح");

            var data = envelope.Data;

            // Deserialize each table from JsonElement
            var receptions = Deserialize<List<SampleReception>>(data, "SampleReceptions", opts);
            var recSamples = Deserialize<List<ReceptionSample>>(data, "ReceptionSamples", opts);
            var certificates = Deserialize<List<Certificate>>(data, "Certificates", opts);
            var samples = Deserialize<List<Sample>>(data, "Samples", opts);
            var referralLetters = Deserialize<List<ReferralLetter>>(data, "ReferralLetters", opts);
            var referralCerts = Deserialize<List<ReferralLetterCertificate>>(data, "ReferralLetterCertificates", opts);
            var users = Deserialize<List<User>>(data, "Users", opts);
            var auditLogs = Deserialize<List<AuditLog>>(data, "AuditLogs", opts);

            // Clear existing data in dependency order
            _db.Samples.RemoveRange(_db.Samples);
            _db.ReferralLetterCertificates.RemoveRange(_db.ReferralLetterCertificates);
            _db.ReferralLetters.IgnoreQueryFilters().ToList().ForEach(r => _db.ReferralLetters.Remove(r));
            _db.Certificates.RemoveRange(_db.Certificates);
            _db.ReceptionSamples.RemoveRange(_db.ReceptionSamples);
            _db.SampleReceptions.RemoveRange(_db.SampleReceptions);
            _db.AuditLogs.RemoveRange(_db.AuditLogs);

            await _db.SaveChangesAsync();

            // Reset sequences depending on database provider
            if (_db.Database.IsNpgsql())
            {
                await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Certificates\", \"SampleReceptions\", \"Samples\", \"ReceptionSamples\", \"ReferralLetters\", \"ReferralLetterCertificates\", \"AuditLogs\" RESTART IDENTITY CASCADE;");
            }
            else
            {
                await _db.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name IN ('Certificates','SampleReceptions','Samples','ReceptionSamples','ReferralLetters','AuditLogs');");
            }

            // Insert restored data — merge users (update existing or add)
            foreach (var user in users)
            {
                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    // Fallback for older backups missing PasswordHash (avoid validation crash)
                    continue; 
                }
                var existing = await _db.Users.FirstOrDefaultAsync(u => u.Username == user.Username);
                if (existing == null) 
                {
                    _db.Users.Add(user);
                }
                else
                {
                    existing.PasswordHash = user.PasswordHash;
                    existing.FullName = user.FullName;
                    existing.Role = user.Role;
                    existing.Permissions = user.Permissions;
                }
            }

            _db.SampleReceptions.AddRange(receptions);
            _db.ReceptionSamples.AddRange(recSamples);
            _db.Certificates.AddRange(certificates);
            _db.Samples.AddRange(samples);
            _db.ReferralLetters.AddRange(referralLetters);
            _db.ReferralLetterCertificates.AddRange(referralCerts);
            _db.AuditLogs.AddRange(auditLogs);

            await _db.SaveChangesAsync();

            // Postgres Sequence Sync
            if (_db.Database.IsNpgsql())
            {
                var tablesToSync = new[] { "Certificates", "SampleReceptions", "Samples", "ReceptionSamples", "ReferralLetters", "ReferralLetterCertificates", "AuditLogs", "Users" };
                foreach (var table in tablesToSync)
                {
                    try
                    {
#pragma warning disable EF1002
                        await _db.Database.ExecuteSqlRawAsync($@"
                            SELECT setval(pg_get_serial_sequence('""{table}""', 'Id'), COALESCE((SELECT MAX(""Id"") FROM ""{table}"") + 1, 1), false);
                        ");
#pragma warning restore EF1002
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to sync sequence for table {Table}", table);
                    }
                }
            }

            _logger.LogInformation("Backup restored successfully at {Time}", DateTime.UtcNow);
        }

        private static T Deserialize<T>(JsonElement data, string propertyName, JsonSerializerOptions opts) where T : new()
        {
            if (data.TryGetProperty(propertyName, out var element))
                return JsonSerializer.Deserialize<T>(element.GetRawText(), opts) ?? new T();
            return new T();
        }

        // ═══════════════════════════════════════════════
        // Archive Logs (Soft Archive)
        // ═══════════════════════════════════════════════

        public async Task<int> ArchiveLogsAsync(int months)
        {
            var cutoffDate = DateTime.UtcNow.AddMonths(-months);
            var logsToArchive = await _db.AuditLogs
                .Where(l => l.Timestamp < cutoffDate && !l.IsArchived)
                .ToListAsync();

            foreach (var log in logsToArchive)
            {
                log.IsArchived = true;
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Archived {Count} audit logs older than {Months} months", logsToArchive.Count, months);
            return logsToArchive.Count;
        }

        // ═══════════════════════════════════════════════
        // Reset
        // ═══════════════════════════════════════════════

        public async Task SoftResetAsync()
        {
            var settings = await GetSystemSettingsAsync();
            settings.EnableAlerts = true;
            settings.AlertThresholdDays = 7;
            settings.AutoBackupEnabled = false;
            settings.BackupFrequency = "daily";
            settings.MaintenanceMode = false;
            settings.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task HardResetAsync(int currentUserId)
        {
            // Clear all data except current user
            _db.Samples.RemoveRange(_db.Samples);
            _db.ReferralLetterCertificates.RemoveRange(_db.ReferralLetterCertificates);
            _db.ReferralLetters.IgnoreQueryFilters().ToList().ForEach(r => _db.ReferralLetters.Remove(r));
            _db.Certificates.RemoveRange(_db.Certificates);
            _db.ReceptionSamples.RemoveRange(_db.ReceptionSamples);
            _db.SampleReceptions.RemoveRange(_db.SampleReceptions);
            _db.AuditLogs.RemoveRange(_db.AuditLogs);

            // Remove all users except current
            var otherUsers = await _db.Users.Where(u => u.Id != currentUserId).ToListAsync();
            _db.Users.RemoveRange(otherUsers);

            // Reset settings
            await SoftResetAsync();

            await _db.SaveChangesAsync();

            // Reset sequences depending on database provider
            if (_db.Database.IsNpgsql())
            {
                await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Certificates\", \"SampleReceptions\", \"Samples\", \"ReceptionSamples\", \"ReferralLetters\", \"ReferralLetterCertificates\", \"AuditLogs\" RESTART IDENTITY CASCADE;");
            }
            else
            {
                await _db.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name IN ('Certificates','SampleReceptions','Samples','ReceptionSamples','ReferralLetters','AuditLogs');");
            }

            _logger.LogWarning("Hard reset executed by user {UserId}", currentUserId);
        }

        // ═══════════════════════════════════════════════
        // Maintenance Mode
        // ═══════════════════════════════════════════════

        public async Task SetMaintenanceModeAsync(bool enabled)
        {
            var settings = await GetSystemSettingsAsync();
            settings.MaintenanceMode = enabled;
            await _db.SaveChangesAsync();
        }

        public async Task<bool> IsMaintenanceModeAsync()
        {
            var settings = await _db.SystemSettings.FirstOrDefaultAsync();
            return settings?.MaintenanceMode ?? false;
        }

        // ═══════════════════════════════════════════════
        // Locks (Distributed Lock via DB)
        // ═══════════════════════════════════════════════

        public async Task<bool> AcquireLockAsync(string name, TimeSpan duration)
        {
            var existing = await _db.SystemLocks.FindAsync(name);

            if (existing != null && existing.LockedUntil > DateTime.UtcNow)
            {
                return false; // Lock is still active
            }

            if (existing == null)
            {
                _db.SystemLocks.Add(new SystemLock
                {
                    Name = name,
                    LockedUntil = DateTime.UtcNow.Add(duration),
                    LockedBy = Environment.MachineName
                });
            }
            else
            {
                existing.LockedUntil = DateTime.UtcNow.Add(duration);
                existing.LockedBy = Environment.MachineName;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task ReleaseLockAsync(string name)
        {
            var existing = await _db.SystemLocks.FindAsync(name);
            if (existing != null)
            {
                existing.LockedUntil = DateTime.UtcNow.AddMinutes(-1);
                await _db.SaveChangesAsync();
            }
        }

        // ═══════════════════════════════════════════════
        // Alerts (عينات مضى عليها أيام بدون شهادة)
        // ═══════════════════════════════════════════════

        public async Task<List<AlertDto>> GetPendingAlertsAsync()
        {
            var settings = await GetSystemSettingsAsync();
            if (!settings.EnableAlerts) return new List<AlertDto>();

            var threshold = DateTime.UtcNow.AddDays(-settings.AlertThresholdDays);

            // العينات المستلمة التي مر عليها أكثر من AlertThresholdDays يوم وحالتها "لم يتم إصدار شهادة"
            var pendingReceptions = await _db.SampleReceptions
                .Where(r => r.Date <= threshold && r.Status == "لم يتم إصدار شهادة")
                .Select(r => new AlertDto
                {
                    ReceptionId = r.Id,
                    ReceptionNumber = r.AnalysisRequestNumber,
                    Sender = r.Sender,
                    ReceivedDate = r.Date,
                    DaysPending = (int)(DateTime.UtcNow - r.Date).TotalDays
                })
                .ToListAsync();

            return pendingReceptions;
        }

        // ═══════════════════════════════════════════════
        // Crypto Helpers
        // ═══════════════════════════════════════════════

        private static string ComputeSha256(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static byte[] EncryptWithPassword(byte[] data, string password)
        {
            var salt = RandomNumberGenerator.GetBytes(16);
            var iv = RandomNumberGenerator.GetBytes(16);

            using var key = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            using var aes = Aes.Create();
            aes.Key = key.GetBytes(32);
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            var encrypted = encryptor.TransformFinalBlock(data, 0, data.Length);

            // Format: [salt:16][iv:16][encrypted data]
            var result = new byte[salt.Length + iv.Length + encrypted.Length];
            Buffer.BlockCopy(salt, 0, result, 0, salt.Length);
            Buffer.BlockCopy(iv, 0, result, salt.Length, iv.Length);
            Buffer.BlockCopy(encrypted, 0, result, salt.Length + iv.Length, encrypted.Length);

            return result;
        }

        private static byte[] DecryptWithPassword(byte[] encryptedData, string password)
        {
            var salt = new byte[16];
            var iv = new byte[16];
            var cipherText = new byte[encryptedData.Length - 32];

            Buffer.BlockCopy(encryptedData, 0, salt, 0, 16);
            Buffer.BlockCopy(encryptedData, 16, iv, 0, 16);
            Buffer.BlockCopy(encryptedData, 32, cipherText, 0, cipherText.Length);

            using var key = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            using var aes = Aes.Create();
            aes.Key = key.GetBytes(32);
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            return decryptor.TransformFinalBlock(cipherText, 0, cipherText.Length);
        }
    }

    // Custom JSON converters for UTC DateTimes
    public class UtcDateTimeConverter : System.Text.Json.Serialization.JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => DateTime.SpecifyKind(reader.GetDateTime(), DateTimeKind.Utc);

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToUniversalTime().ToString("O"));
    }

    public class NullableUtcDateTimeConverter : System.Text.Json.Serialization.JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.TokenType == JsonTokenType.Null ? null : DateTime.SpecifyKind(reader.GetDateTime(), DateTimeKind.Utc);

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value.HasValue) writer.WriteStringValue(value.Value.ToUniversalTime().ToString("O"));
            else writer.WriteNullValue();
        }
    }
}
