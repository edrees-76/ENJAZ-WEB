using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    // ═══════════════════════════════════════════════
    // Auth DTOs — نماذج النقل للمصادقة
    // ═══════════════════════════════════════════════

    /// <summary>
    /// طلب تسجيل الدخول
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "اسم المستخدم مطلوب")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        public required string Password { get; set; }
    }

    /// <summary>
    /// استجابة تسجيل الدخول الناجح
    /// </summary>
    public class LoginResponseDto
    {
        /// <summary>Access Token (JWT) — صلاحية 30 دقيقة</summary>
        public required string AccessToken { get; set; }

        /// <summary>بيانات المستخدم</summary>
        public required UserDto User { get; set; }
    }

    /// <summary>
    /// استجابة فشل تسجيل الدخول مع تفاصيل Rate Limiting
    /// </summary>
    public class LoginErrorDto
    {
        public required string Message { get; set; }

        /// <summary>عدد المحاولات المتبقية قبل القفل (null = مقفل)</summary>
        public int? RemainingAttempts { get; set; }

        /// <summary>وقت إعادة المحاولة بالثواني (عند القفل)</summary>
        public int? RetryAfterSeconds { get; set; }
    }

    // ═══════════════════════════════════════════════
    // Audit Log DTOs
    // ═══════════════════════════════════════════════

    /// <summary>
    /// بيانات سجل النشاط المُعادة من API
    /// </summary>
    public class AuditLogDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
        public DateTime Timestamp { get; set; }
        public int? ReferenceId { get; set; }

        public static AuditLogDto FromEntity(AuditLog log) => new()
        {
            Id = log.Id,
            UserId = log.UserId,
            UserName = log.UserName,
            Action = log.Action,
            Details = log.Details,
            Timestamp = log.Timestamp.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(log.Timestamp, DateTimeKind.Utc) : log.Timestamp,
            ReferenceId = log.ReferenceId
        };
    }

    /// <summary>
    /// فلاتر استعلام سجل النشاطات
    /// </summary>
    public class AuditLogFilterDto
    {
        public int? UserId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Limit { get; set; } = 200;
    }

    /// <summary>
    /// إحصائيات النشاطات اليومية
    /// </summary>
    public class AuditLogStatsDto
    {
        public int ActivitiesToday { get; set; }
        public int ModificationsToday { get; set; }
        public string? MostActiveUser { get; set; }
    }
}
