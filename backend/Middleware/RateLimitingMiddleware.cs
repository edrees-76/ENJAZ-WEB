using Microsoft.Extensions.Caching.Distributed;
using System.Net;

namespace backend.Middleware
{
    /// <summary>
    /// Core-B M3: Global API rate limiter using Redis distributed cache.
    /// - General: 100 requests per minute per IP
    /// - Auth endpoints: 10 requests per minute per IP
    /// Falls back gracefully if Redis is unavailable.
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private const int GeneralLimit = 100;
        private const int AuthLimit = 10;
        private const int WindowSeconds = 60;

        public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IDistributedCache cache)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Determine rate limit based on endpoint
            var isAuthEndpoint = path.Contains("/auth/");
            var limit = isAuthEndpoint ? AuthLimit : GeneralLimit;
            var keyPrefix = isAuthEndpoint ? "rl:auth:" : "rl:api:";
            var key = $"{keyPrefix}{clientIp}";

            try
            {
                var countStr = await cache.GetStringAsync(key);
                var count = string.IsNullOrEmpty(countStr) ? 0 : int.Parse(countStr);

                if (count >= limit)
                {
                    _logger.LogWarning(
                        "Rate limit exceeded for {IP} on {Path} — {Count}/{Limit}",
                        clientIp, path, count, limit);

                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    context.Response.Headers["Retry-After"] = WindowSeconds.ToString();
                    context.Response.ContentType = "application/json; charset=utf-8";

                    await context.Response.WriteAsync(
                        "{\"success\":false,\"error\":{\"message\":\"تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد دقيقة.\",\"code\":429}}");
                    return;
                }

                // Increment counter
                count++;
                await cache.SetStringAsync(key, count.ToString(), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(WindowSeconds)
                });

                // Add rate limit headers
                context.Response.Headers["X-RateLimit-Limit"] = limit.ToString();
                context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, limit - count).ToString();
            }
            catch (Exception ex)
            {
                // Redis down → allow request (fail-open)
                _logger.LogWarning(ex, "Rate limiting unavailable — allowing request from {IP}", clientIp);
            }

            await _next(context);
        }
    }

    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseApiRateLimiting(this IApplicationBuilder app)
        {
            return app.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}
