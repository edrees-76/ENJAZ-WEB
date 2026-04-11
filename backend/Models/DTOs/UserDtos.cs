using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    // ═══════════════════════════════════════════════
    // User DTOs — نماذج النقل لقسم المستخدمين
    // ═══════════════════════════════════════════════

    /// <summary>
    /// بيانات المستخدم المُعادة من API (بدون كلمة المرور)
    /// </summary>
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string RoleDisplayName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsEditor { get; set; }
        public int Permissions { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Specialization { get; set; }
        public string StatusDisplayName { get; set; } = string.Empty;

        /// <summary>تحويل من User Entity إلى DTO</summary>
        public static UserDto FromEntity(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Role = user.Role,
            RoleDisplayName = user.RoleDisplayName,
            IsActive = user.IsActive,
            IsEditor = user.IsEditor,
            Permissions = (int)user.Permissions,
            CreatedAt = user.CreatedAt,
            Specialization = user.Specialization,
            StatusDisplayName = user.StatusDisplayName
        };
    }

    /// <summary>
    /// بيانات إنشاء مستخدم جديد
    /// </summary>
    public class CreateUserDto
    {
        [Required(ErrorMessage = "الاسم الكامل مطلوب")]
        [MaxLength(100)]
        public required string FullName { get; set; }

        [Required(ErrorMessage = "اسم المستخدم مطلوب")]
        [MaxLength(50)]
        public required string Username { get; set; }

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [MinLength(6, ErrorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل")]
        public required string Password { get; set; }

        public UserRole Role { get; set; } = UserRole.User;
        public bool IsEditor { get; set; } = true;

        /// <summary>الصلاحيات كـ Bitmask (int)</summary>
        public int Permissions { get; set; } = 0;

        [MaxLength(100)]
        public string? Specialization { get; set; }
    }

    /// <summary>
    /// بيانات تحديث مستخدم موجود (كلمة المرور اختيارية)
    /// </summary>
    public class UpdateUserDto
    {
        [Required(ErrorMessage = "الاسم الكامل مطلوب")]
        [MaxLength(100)]
        public required string FullName { get; set; }

        [Required(ErrorMessage = "اسم المستخدم مطلوب")]
        [MaxLength(50)]
        public required string Username { get; set; }

        /// <summary>اختياري — يُحدّث فقط إذا أُرسلت قيمة</summary>
        [MinLength(6, ErrorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل")]
        public string? Password { get; set; }

        public UserRole Role { get; set; } = UserRole.User;
        public bool IsEditor { get; set; } = true;
        public int Permissions { get; set; } = 0;

        [MaxLength(100)]
        public string? Specialization { get; set; }
    }

    /// <summary>
    /// إحصائيات المستخدمين
    /// </summary>
    public class UserStatsDto
    {
        public int TotalCount { get; set; }
        public int ActiveCount { get; set; }
        public int AdminCount { get; set; }
    }
}
