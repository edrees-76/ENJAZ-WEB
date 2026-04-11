using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    /// <summary>
    /// أدوار المستخدمين في المنظومة
    /// </summary>
    public enum UserRole
    {
        /// <summary>مشاهد — عرض وطباعة فقط</summary>
        Viewer = 0,

        /// <summary>مستخدم — إصدار وتعديل حسب الصلاحيات</summary>
        User = 1,

        /// <summary>مدير النظام — تحكم كامل</summary>
        Admin = 2
    }

    /// <summary>
    /// صلاحيات تفصيلية (Bitmask) — قابلة للتوسع
    /// </summary>
    [Flags]
    public enum Permission
    {
        None              = 0,
        SampleReceptions  = 1 << 0,   // 1
        Certificates      = 1 << 1,   // 2
        Reports           = 1 << 2,   // 4
        Settings          = 1 << 3,   // 8
        AdminProcedures   = 1 << 4,   // 16
        Users             = 1 << 5,   // 32
        All               = SampleReceptions | Certificates | Reports | Settings | AdminProcedures | Users  // 63
    }

    /// <summary>
    /// نموذج المستخدم — يمثل حساب مستخدم في المنظومة
    /// </summary>
    public class User
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public required string Username { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        [Required, MaxLength(100)]
        public required string FullName { get; set; }

        /// <summary>دور المستخدم (Viewer=0, User=1, Admin=2)</summary>
        public UserRole Role { get; set; } = UserRole.User;

        /// <summary>حالة الحساب — true=نشط، false=مجمد</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>صلاحية التعديل داخل الأقسام المتاحة</summary>
        public bool IsEditor { get; set; } = true;

        /// <summary>الصلاحيات التفصيلية (Bitmask)</summary>
        public Permission Permissions { get; set; } = Permission.None;

        /// <summary>تاريخ إنشاء الحساب</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>التخصص (اختياري)</summary>
        [MaxLength(100)]
        public string? Specialization { get; set; }

        // ═══════════════════════════════════════
        // Computed Properties (not mapped to DB)
        // ═══════════════════════════════════════

        /// <summary>هل المستخدم مدير؟</summary>
        public bool IsAdmin => Role == UserRole.Admin;

        /// <summary>اسم الدور بالعربية</summary>
        public string RoleDisplayName => Role switch
        {
            UserRole.Admin => "مدير النظام",
            UserRole.User => "مستخدم",
            UserRole.Viewer => "مشاهد",
            _ => "غير محدد"
        };

        /// <summary>حالة الحساب بالعربية</summary>
        public string StatusDisplayName => IsActive ? "نشط" : "موقوف";

        // ═══════════════════════════════════════
        // Permission Helpers
        // ═══════════════════════════════════════

        /// <summary>فحص صلاحية معينة — المدير يملك الكل ضمنياً</summary>
        public bool HasPermission(Permission permission)
        {
            if (Role == UserRole.Admin) return true;
            return (Permissions & permission) != 0;
        }

        /// <summary>هل يمكنه إصدار شهادات</summary>
        public bool CanIssueCertificates => Role == UserRole.Admin || Role == UserRole.User;

        /// <summary>هل يمكنه تعديل شهادات</summary>
        public bool CanEditCertificates => Role == UserRole.Admin || (Role == UserRole.User && IsEditor);

        /// <summary>هل يمكنه إدارة المستخدمين</summary>
        public bool CanManageUsers => Role == UserRole.Admin || HasPermission(Permission.Users);

        // Navigation Properties
        [JsonIgnore]
        public ICollection<AuditLog>? AuditLogs { get; set; }

        [JsonIgnore]
        public ICollection<RefreshToken>? RefreshTokens { get; set; }
    }
}
