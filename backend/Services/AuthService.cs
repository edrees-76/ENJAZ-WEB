using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace backend.Services
{
    // ═══════════════════════════════════════════════
    // Interface
    // ═══════════════════════════════════════════════

    public interface IAuthService
    {
        /// <summary>تسجيل الدخول — يتحقق من البيانات ويُصدر JWT + Refresh Token</summary>
        Task<(LoginResponseDto? Response, LoginErrorDto? Error)> LoginAsync(LoginRequestDto dto, string ipAddress, string? userAgent);

        /// <summary>تجديد Access Token باستخدام Refresh Token</summary>
        Task<(LoginResponseDto? Response, string? Error)> RefreshTokenAsync(string refreshToken, string ipAddress);

        /// <summary>إلغاء جميع Refresh Tokens للمستخدم (Logout)</summary>
        Task RevokeAllTokensAsync(int userId);

        /// <summary>الحصول على بيانات المستخدم الحالي من JWT Claims</summary>
        Task<UserDto?> GetCurrentUserAsync(int userId);
    }

    // ═══════════════════════════════════════════════
    // Implementation
    // ═══════════════════════════════════════════════

    public class AuthService : IAuthService
    {
        private readonly EnjazDbContext _db;
        private readonly PasswordService _passwordService;
        private readonly ILoginRateLimiter _rateLimiter;
        private readonly IAuditLogService _auditLog;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        // JWT Configuration
        private const int AccessTokenMinutes = 30;
        private const int RefreshTokenDays = 7;

        public AuthService(
            EnjazDbContext db,
            PasswordService passwordService,
            ILoginRateLimiter rateLimiter,
            IAuditLogService auditLog,
            IConfiguration config,
            ILogger<AuthService> logger)
        {
            _db = db;
            _passwordService = passwordService;
            _rateLimiter = rateLimiter;
            _auditLog = auditLog;
            _config = config;
            _logger = logger;
        }

        public async Task<(LoginResponseDto? Response, LoginErrorDto? Error)> LoginAsync(
            LoginRequestDto dto, string ipAddress, string? userAgent)
        {
            var rateLimitKey = $"{ipAddress}:{dto.Username}";

            // 1. Check rate limiting
            if (_rateLimiter.IsLockedOut(rateLimitKey))
            {
                var remaining = _rateLimiter.GetRemainingLockout(rateLimitKey);
                _logger.LogWarning("Login blocked (rate limited): {Username} from {IP}", dto.Username, ipAddress);

                return (null, new LoginErrorDto
                {
                    Message = "تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة لاحقاً.",
                    RemainingAttempts = null,
                    RetryAfterSeconds = (int)(remaining?.TotalSeconds ?? 300)
                });
            }

            // 2. Find user
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);

            // 3. Generic error — don't reveal if user exists
            if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
            {
                _rateLimiter.RecordFailure(rateLimitKey);
                var attemptsLeft = _rateLimiter.GetRemainingAttempts(rateLimitKey);

                await _auditLog.LogAsync(null, dto.Username, "فشل تسجيل الدخول",
                    $"محاولة فاشلة من {ipAddress}", ipAddress: ipAddress, userAgent: userAgent);

                return (null, new LoginErrorDto
                {
                    Message = "اسم المستخدم أو كلمة المرور غير صحيحة",
                    RemainingAttempts = attemptsLeft,
                    RetryAfterSeconds = null
                });
            }

            // 4. Check if account is frozen
            if (!user.IsActive)
            {
                await _auditLog.LogAsync(user.Id, user.Username, "محاولة دخول لحساب مجمد",
                    $"من {ipAddress}", ipAddress: ipAddress, userAgent: userAgent);

                return (null, new LoginErrorDto
                {
                    Message = "حسابك مجمد. يرجى التواصل مع مدير النظام.",
                    RemainingAttempts = null,
                    RetryAfterSeconds = null
                });
            }

            // 5. Login success — reset rate limiter
            _rateLimiter.Reset(rateLimitKey);

            // 6. Upgrade legacy password hash if needed
            if (!user.PasswordHash.StartsWith("v2:"))
            {
                user.PasswordHash = _passwordService.HashPassword(dto.Password);
                _db.Users.Update(user);
                await _db.SaveChangesAsync();
                _logger.LogInformation("Upgraded password hash for user: {Username}", user.Username);
            }

            // 7. Generate tokens
            var accessToken = GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress);

            // 8. Audit log
            await _auditLog.LogAsync(user.Id, user.FullName, "تسجيل دخول",
                $"دخول ناجح من {ipAddress}", ipAddress: ipAddress, userAgent: userAgent);

            _logger.LogInformation("User logged in: {Username} from {IP}", user.Username, ipAddress);

            return (new LoginResponseDto
            {
                AccessToken = accessToken,
                User = UserDto.FromEntity(user)
            }, null);
        }

        public async Task<(LoginResponseDto? Response, string? Error)> RefreshTokenAsync(
            string refreshToken, string ipAddress)
        {
            // Find the token in DB
            var storedToken = await _db.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (storedToken == null || !storedToken.IsValid)
            {
                return (null, "Refresh token غير صالح أو منتهي الصلاحية");
            }

            if (!storedToken.User.IsActive)
            {
                return (null, "الحساب مجمد");
            }

            // Revoke old token (rotation)
            storedToken.IsRevoked = true;
            _db.RefreshTokens.Update(storedToken);

            // Generate new tokens
            var newAccessToken = GenerateAccessToken(storedToken.User);
            var newRefreshToken = await CreateRefreshTokenAsync(storedToken.UserId, ipAddress);

            await _db.SaveChangesAsync();

            return (new LoginResponseDto
            {
                AccessToken = newAccessToken,
                User = UserDto.FromEntity(storedToken.User)
            }, null);
        }

        public async Task RevokeAllTokensAsync(int userId)
        {
            var tokens = await _db.RefreshTokens
                .Where(r => r.UserId == userId && !r.IsRevoked)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("All refresh tokens revoked for user ID: {UserId}", userId);
        }

        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _db.Users.FindAsync(userId);
            return user == null ? null : UserDto.FromEntity(user);
        }

        // ═══════════════════════════════════════
        // Private Helpers
        // ═══════════════════════════════════════

        private string GenerateAccessToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is not configured.");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("fullName", user.FullName),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("permissions", ((int)user.Permissions).ToString()),
                new Claim("isEditor", user.IsEditor.ToString().ToLower())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(AccessTokenMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> CreateRefreshTokenAsync(int userId, string? ipAddress)
        {
            // Generate cryptographically secure token
            var tokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var refreshToken = new RefreshToken
            {
                UserId = userId,
                Token = tokenValue,
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
                IpAddress = ipAddress
            };

            _db.RefreshTokens.Add(refreshToken);
            await _db.SaveChangesAsync();

            // ═══════════════════════════════════════
            // Auth Hardening: Per-user session limit (max 3 active)
            // Prevents unlimited concurrent sessions.
            // Oldest sessions are auto-revoked.
            // ═══════════════════════════════════════
            const int maxActiveSessions = 3;

            var activeTokens = await _db.RefreshTokens
                .Where(r => r.UserId == userId && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            if (activeTokens.Count > maxActiveSessions)
            {
                var tokensToRevoke = activeTokens.Skip(maxActiveSessions).ToList();
                foreach (var t in tokensToRevoke)
                {
                    t.IsRevoked = true;
                }
                _logger.LogInformation(
                    "Auto-revoked {Count} old sessions for user {UserId} (limit: {Max})",
                    tokensToRevoke.Count, userId, maxActiveSessions);
            }

            // Cleanup expired/revoked tokens (keep last 10 for audit trail)
            var expiredTokens = await _db.RefreshTokens
                .Where(r => r.UserId == userId && (r.IsRevoked || r.ExpiresAt < DateTime.UtcNow))
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            if (expiredTokens.Count > 10)
            {
                _db.RefreshTokens.RemoveRange(expiredTokens.Take(expiredTokens.Count - 10));
            }

            await _db.SaveChangesAsync();

            return tokenValue;
        }
    }
}
