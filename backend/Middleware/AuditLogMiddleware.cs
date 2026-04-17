using backend.Services;
using System.Security.Claims;
using System.Text;

namespace backend.Middleware
{
    public class AuditLogMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLogMiddleware> _logger;

        public AuditLogMiddleware(RequestDelegate next, ILogger<AuditLogMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuditLogService auditLogService)
        {
            // Only log mutating methods (POST, PUT, DELETE, PATCH)
            var method = context.Request.Method;
            if (method == HttpMethods.Get || method == HttpMethods.Options || method == HttpMethods.Head)
            {
                await _next(context);
                return;
            }

            // Skip paths that have explicit, detailed audit logging in their controllers
            // Note: paths include API version prefix, e.g. /api/v1/samples
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && (
                path.Contains("/auth/login") || path.Contains("/auth/refresh") || path.Contains("/auth/logout") ||
                path.Contains("/samples") || path.Contains("/certificates") || 
                path.Contains("/admin-procedures") || path.Contains("/users") ||
                path.Contains("/hubs/")))
            {
                await _next(context);
                return;
            }

            // We let the request proceed, but if it succeeds, we log it
            await _next(context);

            // If the request was successful
            if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userNameClaim = context.User.FindFirst(ClaimTypes.Name)?.Value;
                var fullNameClaim = context.User.FindFirst("fullName")?.Value;

                if (int.TryParse(userIdClaim, out int userId))
                {
                    var endpoint = context.GetEndpoint()?.DisplayName ?? context.Request.Path;
                    var ip = context.Connection.RemoteIpAddress?.ToString();
                    var userAgent = context.Request.Headers.UserAgent.ToString();

                    string entityName = "بيانات";
                    if (path != null)
                    {
                        if (path.Contains("/samples")) entityName = "عينة";
                        else if (path.Contains("/certificates")) entityName = "شهادة";
                        else if (path.Contains("/users")) entityName = "مستخدم";
                        else if (path.Contains("/reports")) entityName = "تقرير";
                        else if (path.Contains("/settings")) entityName = "إعدادات";
                    }

                    string actionType = method switch
                    {
                        "POST" => $"إضافة {entityName}",
                        "PUT" => $"تحديث {entityName}",
                        "PATCH" => $"تعديل حالة {entityName}",
                        "DELETE" => $"حذف {entityName}",
                        _ => "إجراء غير معروف"
                    };

                    // Note: We run this asynchronously after response without blocking,
                    // but we ensure it completes using Task.Run or just await it here since it's inside middleware chain
                    try
                    {
                        await auditLogService.LogAsync(
                            userId: userId,
                            userName: fullNameClaim ?? userNameClaim,
                            action: $"API {actionType}",
                            details: $"تم تنفيذ العملية عبر المسار: {context.Request.Path}",
                            ipAddress: ip,
                            userAgent: userAgent
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to write global audit log for path {Path}", context.Request.Path);
                    }
                }
            }
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class AuditLogMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalAuditLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuditLogMiddleware>();
        }
    }
}
