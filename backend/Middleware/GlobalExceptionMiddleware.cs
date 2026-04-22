using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Middleware
{
    /// <summary>
    /// Core-A M2: Unified error response middleware.
    /// Catches all unhandled exceptions and returns structured RFC 7807 ProblemDetails.
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
            var (statusCode, userMessage, type) = exception switch
            {
                ArgumentException => (HttpStatusCode.BadRequest, "بيانات الطلب غير صالحة", "https://tools.ietf.org/html/rfc7231#section-6.5.1"),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "غير مصرح لك بهذا الإجراء", "https://tools.ietf.org/html/rfc7235#section-3.1"),
                KeyNotFoundException => (HttpStatusCode.NotFound, "العنصر المطلوب غير موجود", "https://tools.ietf.org/html/rfc7231#section-6.5.4"),
                InvalidOperationException => (HttpStatusCode.Conflict, "لا يمكن تنفيذ هذا الإجراء حالياً", "https://tools.ietf.org/html/rfc7231#section-6.5.8"),
                TimeoutException => (HttpStatusCode.GatewayTimeout, "انتهت مهلة العملية", "https://tools.ietf.org/html/rfc7231#section-6.6.5"),
                _ => (HttpStatusCode.InternalServerError, "حدث خطأ داخلي في الخادم", "https://tools.ietf.org/html/rfc7231#section-6.6.1")
            };

            var correlationId = context.TraceIdentifier;

            // Advanced Logging (Exception details + CorrelationId)
            _logger.LogError(exception,
                "Unhandled exception | Path={Path} | Method={Method} | Status={StatusCode} | User={User} | CorrelationId={CorrelationId} | Error={ErrorMessage}",
                context.Request.Path,
                context.Request.Method,
                (int)statusCode,
                context.User?.Identity?.Name ?? "Anonymous",
                correlationId,
                exception.Message);

            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/problem+json; charset=utf-8"; // RFC 7807 standard content type

            var problemDetails = new ProblemDetails
            {
                Status = (int)statusCode,
                Type = type,
                Title = userMessage,
                Detail = "حدث خطأ أثناء معالجة الطلب، يرجى تزويد الدعم الفني برقم التتبع.",
                Instance = context.Request.Path
            };

            // Extensions for tracking
            problemDetails.Extensions["correlationId"] = correlationId;
            problemDetails.Extensions["timestamp"] = DateTime.UtcNow;

            var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
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
