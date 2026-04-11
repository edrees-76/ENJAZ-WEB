using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    /// <summary>
    /// إعدادات مخصصة لكل مستخدم (المظهر، الخط...)
    /// </summary>
    public class UserSettings
    {
        public int Id { get; set; }

        /// <summary>معرف المستخدم المرتبط</summary>
        public int UserId { get; set; }

        /// <summary>الوضع الداكن</summary>
        public bool IsDarkMode { get; set; } = true;

        /// <summary>مقياس حجم الخط (1.0 = الافتراضي)</summary>
        public double FontSizeScale { get; set; } = 1.0;

        /// <summary>تاريخ آخر تحديث</summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [JsonIgnore]
        public User? User { get; set; }
    }
}
