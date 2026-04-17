using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    /// <summary>
    /// سجل النشاطات — يتتبع جميع عمليات المستخدمين
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }

        /// <summary>معرف المستخدم الذي قام بالعملية</summary>
        public int? UserId { get; set; }

        /// <summary>اسم المستخدم وقت تنفيذ العملية (يُحفظ للرجوع إليه حتى لو حُذف المستخدم)</summary>
        [MaxLength(100)]
        public string? UserName { get; set; }

        /// <summary>نوع العملية (تسجيل دخول، إضافة شهادة، تعديل، حذف...)</summary>
        [Required, MaxLength(100)]
        public required string Action { get; set; }

        /// <summary>وصف تفصيلي للعملية</summary>
        [MaxLength(2000)]
        public string? Details { get; set; }

        /// <summary>توقيت العملية (UTC)</summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>معرف المرجع المرتبط (مثل رقم الشهادة)</summary>
        public int? ReferenceId { get; set; }

        /// <summary>عنوان IP للعميل — خاص بالويب</summary>
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>معلومات المتصفح — خاص بالويب</summary>
        [MaxLength(300)]
        public string? UserAgent { get; set; }

        /// <summary>هل تم أرشفة هذا السجل (Soft Archive)</summary>
        public bool IsArchived { get; set; } = false;

        // Navigation
        [JsonIgnore]
        public User? User { get; set; }
    }
}
