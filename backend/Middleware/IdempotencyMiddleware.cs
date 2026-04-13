using Microsoft.Extensions.Caching.Distributed;
using System.Net;

namespace backend.Middleware
{
    /// <summary>
    /// Core-B M3: Idempotency middleware for POST/PUT/PATCH requests.
    /// Client sends X-Idempotency-Key header.
    /// If the same key is seen within 10 minutes, returns cached response.
    /// Uses Redis with DB awareness through cache abstraction.
    /// </summary>
    public class IdempotencyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IdempotencyMiddleware> _logger;
        private static readonly TimeSpan KeyExpiry = TimeSpan.FromMinutes(10);

        public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IDistributedCache cache)
        {
            // Only apply to mutating methods
            var method = context.Request.Method;
            if (method != "POST" && method != "PUT" && method != "PATCH")
            {
                await _next(context);
                return;
            }

            // Check for idempotency key
            if (!context.Request.Headers.TryGetValue("X-Idempotency-Key", out var idempotencyKey)
                || string.IsNullOrWhiteSpace(idempotencyKey))
            {
                // No key provided — proceed normally
                await _next(context);
                return;
            }

            var cacheKey = $"idem:{idempotencyKey}";

            try
            {
                // Check if we've already processed this key
                var cached = await cache.GetStringAsync(cacheKey);
                if (cached != null)
                {
                    _logger.LogInformation(
                        "Idempotency: Duplicate request detected for key {Key} — returning cached response",
                        idempotencyKey.ToString());

                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.Headers["X-Idempotent-Replayed"] = "true";
                    await context.Response.WriteAsync(cached);
                    return;
                }

                // Capture the response
                var originalBody = context.Response.Body;
                using var memoryStream = new MemoryStream();
                context.Response.Body = memoryStream;

                await _next(context);

                // Only cache successful responses
                if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
                {
                    memoryStream.Seek(0, SeekOrigin.Begin);
                    var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

                    // Store in Redis with expiry
                    await cache.SetStringAsync(cacheKey, responseBody, new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = KeyExpiry
                    });

                    // Write to original body
                    memoryStream.Seek(0, SeekOrigin.Begin);
                    await memoryStream.CopyToAsync(originalBody);
                }
                else
                {
                    memoryStream.Seek(0, SeekOrigin.Begin);
                    await memoryStream.CopyToAsync(originalBody);
                }

                context.Response.Body = originalBody;
            }
            catch (Exception ex)
            {
                // Redis down → skip idempotency check (fail-open)
                _logger.LogWarning(ex, "Idempotency check failed — proceeding without duplicate detection");
                await _next(context);
            }
        }
    }

    public static class IdempotencyMiddlewareExtensions
    {
        public static IApplicationBuilder UseIdempotency(this IApplicationBuilder app)
        {
            return app.UseMiddleware<IdempotencyMiddleware>();
        }
    }
}
