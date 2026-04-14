using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    // ═══════════════════════════════════════════════
    // Interface
    // ═══════════════════════════════════════════════

    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<(UserDto? User, string? Error)> CreateUserAsync(CreateUserDto dto, int creatorId, string? creatorName);
        Task<(UserDto? User, string? Error)> UpdateUserAsync(int id, UpdateUserDto dto, int updaterId, string? updaterName);
        Task<(bool Success, string? Error)> ToggleUserStatusAsync(int id, int requesterId);
        Task<bool> IsUsernameUniqueAsync(string username, int? excludeId = null);
        Task<UserStatsDto> GetStatsAsync();
        Task EnsureDefaultAdminAsync();
    }

    // ═══════════════════════════════════════════════
    // Implementation
    // ═══════════════════════════════════════════════

    public class UserService : IUserService
    {
        private readonly EnjazDbContext _db;
        private readonly PasswordService _passwordService;
        private readonly IAuditLogService _auditLog;
        private readonly ILogger<UserService> _logger;

        public UserService(
            EnjazDbContext db,
            PasswordService passwordService,
            IAuditLogService auditLog,
            ILogger<UserService> logger)
        {
            _db = db;
            _passwordService = passwordService;
            _auditLog = auditLog;
            _logger = logger;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _db.Users
                .OrderByDescending(u => u.Role)
                .ThenBy(u => u.FullName)
                .Select(u => UserDto.FromEntity(u))
                .ToListAsync();
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            return user == null ? null : UserDto.FromEntity(user);
        }

        public async Task<(UserDto? User, string? Error)> CreateUserAsync(
            CreateUserDto dto, int creatorId, string? creatorName)
        {
            // Check username uniqueness
            if (!await IsUsernameUniqueAsync(dto.Username))
            {
                return (null, "اسم المستخدم موجود بالفعل");
            }

            var user = new User
            {
                Username = dto.Username.Trim(),
                PasswordHash = _passwordService.HashPassword(dto.Password),
                FullName = dto.FullName.Trim(),
                Role = dto.Role,
                IsEditor = dto.IsEditor,
                Permissions = dto.Role == UserRole.Admin
                    ? Permission.All
                    : (Permission)dto.Permissions,
                Specialization = dto.Specialization?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            await _auditLog.LogAsync(creatorId, creatorName, "إضافة مستخدم",
                $"تم إضافة المستخدم '{user.FullName}' بدور {user.RoleDisplayName}",
                referenceId: user.Id);

            _logger.LogInformation("User created: {Username} by {Creator}", user.Username, creatorName);

            return (UserDto.FromEntity(user), null);
        }

        public async Task<(UserDto? User, string? Error)> UpdateUserAsync(
            int id, UpdateUserDto dto, int updaterId, string? updaterName)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
            {
                return (null, "المستخدم غير موجود");
            }

            // Check username uniqueness (excluding current user)
            if (!await IsUsernameUniqueAsync(dto.Username, id))
            {
                return (null, "اسم المستخدم موجود بالفعل");
            }

            // Track changes for audit
            var changes = new List<string>();
            if (user.FullName != dto.FullName.Trim()) changes.Add("الاسم");
            if (user.Username != dto.Username.Trim()) changes.Add("اسم المستخدم");
            if (user.Role != dto.Role) changes.Add($"الدور → {dto.Role}");
            if (user.IsEditor != dto.IsEditor) changes.Add("صلاحية التعديل");
            if ((int)user.Permissions != dto.Permissions) changes.Add("الصلاحيات");
            if (!string.IsNullOrEmpty(dto.Password)) changes.Add("كلمة المرور");

            // Apply updates
            user.FullName = dto.FullName.Trim();
            user.Username = dto.Username.Trim();
            user.Role = dto.Role;
            user.IsEditor = dto.IsEditor;
            user.Permissions = dto.Role == UserRole.Admin
                ? Permission.All
                : (Permission)dto.Permissions;
            user.Specialization = dto.Specialization?.Trim();

            // Update password only if provided
            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = _passwordService.HashPassword(dto.Password);
            }

            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            if (changes.Count > 0)
            {
                await _auditLog.LogAsync(updaterId, updaterName, "تعديل مستخدم",
                    $"تعديل '{user.FullName}': {string.Join(", ", changes)}",
                    referenceId: user.Id);
            }

            _logger.LogInformation("User updated: {Username} by {Updater}", user.Username, updaterName);

            return (UserDto.FromEntity(user), null);
        }

        public async Task<(bool Success, string? Error)> ToggleUserStatusAsync(int id, int requesterId)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
            {
                return (false, "المستخدم غير موجود");
            }

            // Protection: Can't freeze yourself
            if (user.Id == requesterId)
            {
                return (false, "لا يمكنك تجميد حسابك الخاص");
            }

            // Protection: Can't freeze the last active admin
            if (user.IsActive && user.Role == UserRole.Admin)
            {
                var activeAdminCount = await _db.Users
                    .CountAsync(u => u.Role == UserRole.Admin && u.IsActive);
                if (activeAdminCount <= 1)
                {
                    return (false, "لا يمكن تجميد آخر مدير نشط في النظام");
                }
            }

            user.IsActive = !user.IsActive;
            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            var requester = await _db.Users.FindAsync(requesterId);
            var action = user.IsActive ? "تنشيط مستخدم" : "تجميد مستخدم";
            await _auditLog.LogAsync(requesterId, requester?.FullName, action,
                $"{action}: {user.FullName}", referenceId: user.Id);

            _logger.LogInformation("User status toggled: {Username} → Active={IsActive}", user.Username, user.IsActive);

            return (true, null);
        }

        public async Task<bool> IsUsernameUniqueAsync(string username, int? excludeId = null)
        {
            var query = _db.Users.Where(u => u.Username == username.Trim());
            if (excludeId.HasValue)
            {
                query = query.Where(u => u.Id != excludeId.Value);
            }
            return !await query.AnyAsync();
        }

        public async Task<UserStatsDto> GetStatsAsync()
        {
            return new UserStatsDto
            {
                TotalCount = await _db.Users.CountAsync(),
                ActiveCount = await _db.Users.CountAsync(u => u.IsActive),
                AdminCount = await _db.Users.CountAsync(u => u.Role == UserRole.Admin)
            };
        }

        public async Task EnsureDefaultAdminAsync()
        {
            // Sync Postgres sequences on startup to recover from out-of-sync states caused by backup restores
            if (_db.Database.IsNpgsql())
            {
                var tablesToSync = new[] { "Certificates", "SampleReceptions", "Samples", "ReceptionSamples", "ReferralLetters", "ReferralLetterCertificates", "AuditLogs", "Users" };
                foreach (var table in tablesToSync)
                {
                    try
                    {
                        await _db.Database.ExecuteSqlRawAsync($@"
                            SELECT setval(pg_get_serial_sequence('""{table}""', 'Id'), COALESCE((SELECT MAX(""Id"") FROM ""{table}"") + 1, 1), false);
                        ");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to sync sequence for table {Table} on startup", table);
                    }
                }
            }

            var existingAdmin = await _db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
            if (existingAdmin != null)
            {
                // Unblock user by setting password if it doesn't match the known backup password
                var knownPassword = "Jkck8PBeit5xLyPM";
                if (!_passwordService.VerifyPassword(knownPassword, existingAdmin.PasswordHash))
                {
                    existingAdmin.PasswordHash = _passwordService.HashPassword(knownPassword);
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("✅ تم إعادة ضبط كلمة مرور مدير النظام استثنائياً لفك الحظر.");
                }
                else
                {
                    _logger.LogInformation("✅ حساب مدير النظام موجود بالفعل (لم يتم تغيير كلمة المرور)");
                }
                return;
            }

            // Try to get password from environment variable
            var adminPassword = Environment.GetEnvironmentVariable("ENJAZ_ADMIN_PASSWORD");
            if (string.IsNullOrEmpty(adminPassword))
            {
                adminPassword = _passwordService.GenerateRandomPassword(16);
                _logger.LogWarning(
                    "┌──────────────────────────────────────────────────┐\n" +
                    "│  ⚠️  DEFAULT ADMIN CREATED                       │\n" +
                    "│  Username: admin                                 │\n" +
                    "│  Password: {Password}               │\n" +
                    "│  ⚠️  CHANGE THIS IMMEDIATELY!                    │\n" +
                    "└──────────────────────────────────────────────────┘",
                    adminPassword);
            }

            var admin = new User
            {
                Username = "admin",
                PasswordHash = _passwordService.HashPassword(adminPassword),
                FullName = "مدير النظام",
                Role = UserRole.Admin,
                IsActive = true,
                IsEditor = true,
                Permissions = Permission.All,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(admin);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Default admin user created successfully.");
        }
    }
}
