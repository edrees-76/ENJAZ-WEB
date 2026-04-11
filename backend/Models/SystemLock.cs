using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// جدول الأقفال — لمنع التنفيذ المزدوج للعمليات الحساسة (مثل النسخ التلقائي)
    /// </summary>
    public class SystemLock
    {
        [Key]
        [MaxLength(50)]
        public required string Name { get; set; }

        /// <summary>القفل ساري حتى هذا التاريخ</summary>
        public DateTime LockedUntil { get; set; }

        /// <summary>اسم الخادم/المثيل الذي أنشأ القفل</summary>
        [MaxLength(100)]
        public string? LockedBy { get; set; }
    }
}
