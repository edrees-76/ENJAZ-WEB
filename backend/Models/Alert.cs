using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public enum AlertSeverity
    {
        Info = 0,
        Warning = 1,
        Critical = 2
    }

    public class Alert
    {
        public int Id { get; set; }

        /// <summary>نوع التنبيه (مثلاً: DelayedSample)</summary>
        [Required, MaxLength(50)]
        public required string Type { get; set; }

        /// <summary>مستوى الخطورة</summary>
        public AlertSeverity Severity { get; set; } = AlertSeverity.Info;

        /// <summary>معرف الكيان المرتبط (مثلاً ID العينة)</summary>
        [Required]
        public int EntityId { get; set; }

        /// <summary>عنوان التنبيه</summary>
        [Required, MaxLength(200)]
        public required string Title { get; set; }

        /// <summary>محتوى التنبيه</summary>
        public string? Message { get; set; }

        /// <summary>مفتاح فريد لمنع التكرار (Type + EntityId)</summary>
        [Required, MaxLength(100)]
        public required string UniqueKey { get; set; }

        /// <summary>هل تم حل المشكلة آلياً؟</summary>
        public bool IsResolved { get; set; } = false;

        public DateTime? ResolvedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<UserAlert>? UserAlerts { get; set; }
    }
}
