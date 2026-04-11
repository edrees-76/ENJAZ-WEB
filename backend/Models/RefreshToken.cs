using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    /// <summary>
    /// Refresh Token — يُخزن في DB ويُرسل للعميل كـ HttpOnly Cookie
    /// </summary>
    public class RefreshToken
    {
        public int Id { get; set; }

        /// <summary>معرف المستخدم المالك</summary>
        public int UserId { get; set; }

        /// <summary>قيمة الـ Token (عشوائية فريدة)</summary>
        [Required, MaxLength(256)]
        public required string Token { get; set; }

        /// <summary>تاريخ انتهاء الصلاحية</summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>تاريخ الإنشاء</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>عنوان IP عند الإنشاء</summary>
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>هل تم إلغاؤه (عند Logout أو Rotation)</summary>
        public bool IsRevoked { get; set; } = false;

        /// <summary>هل انتهت صلاحيته</summary>
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        /// <summary>هل لا يزال صالحاً للاستخدام</summary>
        public bool IsValid => !IsRevoked && !IsExpired;

        // Navigation
        [JsonIgnore]
        public User User { get; set; } = null!;
    }
}
