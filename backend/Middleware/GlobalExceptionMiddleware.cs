using System.Net;
using System.Text.Json;

namespace backend.Middleware
{
    /// <summary>
    /// Core-A M2: Unified error response middleware.
    /// Catches all unhandled exceptions and returns structured JSON.
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var (statusCode, userMessage) = exception switch
            {
                ArgumentException => (HttpStatusCode.BadRequest, "بيانات الطلب غير صالحة"),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "غير مصرح لك بهذا الإجراء"),
                KeyNotFoundException => (HttpStatusCode.NotFound, "العنصر المطلوب غير موجود"),
                InvalidOperationException => (HttpStatusCode.Conflict, "لا يمكن تنفيذ هذا الإجراء حالياً"),
                TimeoutException => (HttpStatusCode.GatewayTimeout, "انتهت مهلة العملية"),
                _ => (HttpStatusCode.InternalServerError, "حدث خطأ داخلي في الخادم")
            };

            // Log with full context
            _logger.LogError(exception,
                "Unhandled exception | Path={Path} | Method={Method} | Status={StatusCode} | User={User}",
                context.Request.Path,
                context.Request.Method,
                (int)statusCode,
                context.User?.Identity?.Name ?? "Anonymous");

            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json; charset=utf-8";

            var response = new
            {
                success = false,
                error = new
                {
                    message = userMessage,
                    code = (int)statusCode,
                    traceId = context.TraceIdentifier,
                    timestamp = DateTime.UtcNow
                }
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            });

            await context.Response.WriteAsync(json);
        }
    }

    public static class GlobalExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<GlobalExceptionMiddleware>();
        }
    }
}
