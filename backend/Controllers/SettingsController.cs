using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/settings")]
    [ApiController]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;
        private readonly IAuditLogService _auditLog;
        private readonly PasswordService _passwordService;

        public SettingsController(
            ISettingsService settingsService,
            IAuditLogService auditLog,
            PasswordService passwordService)
        {
            _settingsService = settingsService;
            _auditLog = auditLog;
            _passwordService = passwordService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        private string GetUserName() => User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        private bool IsAdmin() => User.IsInRole("Admin");

        // ═══════════════════════════════════════════════
        // System Settings
        // ═══════════════════════════════════════════════

        [HttpGet("system")]
        public async Task<IActionResult> GetSystemSettings()
        {
            var settings = await _settingsService.GetSystemSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("system")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateSystemSettings([FromBody] SystemSettingsUpdateDto dto)
        {
            var settings = await _settingsService.UpdateSystemSettingsAsync(dto);
            await _auditLog.LogAsync(GetUserId(), GetUserName(), "تحديث إعدادات النظام");
            return Ok(settings);
        }

        // ═══════════════════════════════════════════════
        // User Settings
        // ═══════════════════════════════════════════════

        [HttpGet("user")]
        public async Task<IActionResult> GetUserSettings()
        {
            var settings = await _settingsService.GetUserSettingsAsync(GetUserId());
            return Ok(settings);
        }

        [HttpPut("user")]
        public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettingsUpdateDto dto)
        {
            var settings = await _settingsService.UpdateUserSettingsAsync(GetUserId(), dto);
            return Ok(settings);
        }

        // ═══════════════════════════════════════════════
        // Alerts
        // ═══════════════════════════════════════════════

        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _settingsService.GetPendingAlertsAsync();
            return Ok(alerts);
        }

        // ═══════════════════════════════════════════════
        // Backup Export
        // ═══════════════════════════════════════════════

        [HttpPost("backup/export")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ExportBackup([FromBody] PasswordDto dto)
        {
            try
            {
                var data = await _settingsService.ExportBackupAsync(dto.Password);
                await _auditLog.LogAsync(GetUserId(), GetUserName(), "تصدير نسخة احتياطية");

                var fileName = $"enjaz_backup_{DateTime.UtcNow:yyyy-MM-dd_HH-mm}.bak";
                return File(data, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "فشل تصدير النسخة الاحتياطية", error = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════
        // Backup Validate (Dry-run)
        // ═══════════════════════════════════════════════

        [HttpPost("backup/validate")]
        [Authorize(Policy = "AdminOnly")]
        [RequestSizeLimit(52_428_800)] // 50MB
        public async Task<IActionResult> ValidateBackup(IFormFile file, [FromForm] string password)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "لم يتم رفع ملف" });

            if (file.Length > 50 * 1024 * 1024)
                return BadRequest(new { message = "حجم الملف يتجاوز الحد المسموح (50MB)" });

            using var stream = file.OpenReadStream();
            var result = await _settingsService.ValidateBackupAsync(stream, password);
            return Ok(result);
        }

        // ═══════════════════════════════════════════════
        // Backup Restore
        // ═══════════════════════════════════════════════

        [HttpPost("backup/restore")]
        [Authorize(Policy = "AdminOnly")]
        [RequestSizeLimit(52_428_800)] // 50MB
        public async Task<IActionResult> RestoreBackup(IFormFile file, [FromForm] string password)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "لم يتم رفع ملف" });

            try
            {
                // Enable maintenance mode
                await _settingsService.SetMaintenanceModeAsync(true);

                using var stream = file.OpenReadStream();

                // Validate first
                var validation = await _settingsService.ValidateBackupAsync(stream, password);
                if (!validation.IsValid)
                    return BadRequest(new { message = validation.Error });

                // Reset stream position for restore
                stream.Position = 0;

                await _settingsService.RestoreBackupAsync(stream, password);

                await _auditLog.LogAsync(GetUserId(), GetUserName(), "استعادة نسخة احتياطية",
                    $"SchemaVersion: {validation.SchemaVersion}");

                return Ok(new { message = "تمت استعادة النسخة الاحتياطية بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "فشل استعادة النسخة الاحتياطية", error = ex.Message });
            }
            finally
            {
                await _settingsService.SetMaintenanceModeAsync(false);
            }
        }

        // ═══════════════════════════════════════════════
        // Archive Logs
        // ═══════════════════════════════════════════════

        [HttpPost("archive-logs")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ArchiveLogs([FromBody] ArchiveDto dto)
        {
            var count = await _settingsService.ArchiveLogsAsync(dto.Months);
            await _auditLog.LogAsync(GetUserId(), GetUserName(), "أرشفة السجلات",
                $"أرشفة {count} سجل أقدم من {dto.Months} أشهر");
            return Ok(new { message = $"تمت أرشفة {count} سجل بنجاح", count });
        }

        // ═══════════════════════════════════════════════
        // Soft Reset
        // ═══════════════════════════════════════════════

        [HttpPost("soft-reset")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> SoftReset()
        {
            await _settingsService.SoftResetAsync();
            await _auditLog.LogAsync(GetUserId(), GetUserName(), "إعادة ضبط الإعدادات (Soft Reset)");
            return Ok(new { message = "تمت إعادة ضبط الإعدادات بنجاح" });
        }

        // ═══════════════════════════════════════════════
        // Hard Reset (Factory Reset)
        // ═══════════════════════════════════════════════

        [HttpPost("hard-reset")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> HardReset([FromBody] HardResetDto dto)
        {
            if (dto.ConfirmPhrase != "اريد ذلك بالضبط")
                return BadRequest(new { message = "جملة التأكيد غير صحيحة" });

            // Verify admin password
            var db = HttpContext.RequestServices.GetRequiredService<Data.EnjazDbContext>();
            var user = await db.Users.FindAsync(GetUserId());
            if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "كلمة المرور غير صحيحة" });

            try
            {
                // Auto-backup before reset
                try
                {
                    var backupData = await _settingsService.ExportBackupAsync(dto.Password);
                    var backupDir = Path.Combine(AppContext.BaseDirectory, "backups", "pre-reset");
                    Directory.CreateDirectory(backupDir);
                    var backupPath = Path.Combine(backupDir, $"pre_reset_{DateTime.UtcNow:yyyy-MM-dd_HH-mm}.bak");
                    await System.IO.File.WriteAllBytesAsync(backupPath, backupData);
                }
                catch (Exception ex)
                {
                    // Log but don't block reset
                    var logger = HttpContext.RequestServices.GetRequiredService<ILogger<SettingsController>>();
                    logger.LogWarning(ex, "Pre-reset backup failed");
                }

                await _settingsService.HardResetAsync(GetUserId());
                await _auditLog.LogAsync(GetUserId(), GetUserName(), "⚠️ إعادة ضبط المنظومة (Hard Reset)");

                return Ok(new { message = "تمت إعادة ضبط المنظومة بنجاح. تم مسح كافة البيانات." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "فشل إعادة الضبط", error = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════
        // Maintenance Mode Check
        // ═══════════════════════════════════════════════

        [HttpGet("maintenance")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMaintenanceStatus()
        {
            var isOn = await _settingsService.IsMaintenanceModeAsync();
            return Ok(new { maintenanceMode = isOn });
        }
    }

    // ═══════════════════════════════════════════════
    // Request DTOs
    // ═══════════════════════════════════════════════

    public class PasswordDto
    {
        public required string Password { get; set; }
    }

    public class ArchiveDto
    {
        public int Months { get; set; } = 6;
    }

    public class HardResetDto
    {
        public required string Password { get; set; }
        public required string ConfirmPhrase { get; set; }
    }
}
