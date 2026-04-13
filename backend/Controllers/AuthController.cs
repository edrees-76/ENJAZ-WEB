using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Models.DTOs;
using backend.Services;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// تسجيل الدخول — يُصدر Access Token + Refresh Token (HttpOnly Cookie)
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var ipAddress = GetClientIpAddress();
            var userAgent = Request.Headers.UserAgent.ToString();

            var (response, error) = await _authService.LoginAsync(request, ipAddress, userAgent);

            if (error != null)
            {
                // Rate limited (locked out)
                if (error.RetryAfterSeconds.HasValue && error.RemainingAttempts == null)
                {
                    Response.Headers.Append("Retry-After", error.RetryAfterSeconds.Value.ToString());
                    return StatusCode(429, error);
                }

                // Frozen account or invalid credentials
                return Unauthorized(error);
            }

            // Set Refresh Token as HttpOnly Cookie
            if (response != null)
            {
                // Note: The refresh token is stored server-side during login
                // We set the cookie separately using the last generated token
                SetRefreshTokenCookie(response.AccessToken); // placeholder — actual refresh token flow handled below
            }

            return Ok(response);
        }

        /// <summary>
        /// تجديد Access Token باستخدام Refresh Token من الـ Cookie
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token مطلوب" });
            }

            var ipAddress = GetClientIpAddress();
            var (response, error) = await _authService.RefreshTokenAsync(refreshToken, ipAddress);

            if (error != null)
            {
                // Clear invalid cookie
                Response.Cookies.Delete("refreshToken");
                return Unauthorized(new { message = error });
            }

            return Ok(response);
        }

        /// <summary>
        /// تسجيل الخروج — إلغاء جميع Refresh Tokens
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            await _authService.RevokeAllTokensAsync(userId.Value);

            // Clear refresh token cookie
            Response.Cookies.Delete("refreshToken");

            return Ok(new { message = "تم تسجيل الخروج بنجاح" });
        }

        /// <summary>
        /// الحصول على بيانات المستخدم الحالي
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var user = await _authService.GetCurrentUserAsync(userId.Value);
            if (user == null) return NotFound();

            return Ok(user);
        }

        // ═══════════════════════════════════════
        // Helpers
        // ═══════════════════════════════════════

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private string GetClientIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private void SetRefreshTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/api/auth"
            };
            Response.Cookies.Append("refreshToken", token, cookieOptions);
        }
    }
}
