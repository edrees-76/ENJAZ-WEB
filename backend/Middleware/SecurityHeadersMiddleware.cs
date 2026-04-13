namespace backend.Middleware
{
    /// <summary>
    /// Core-B M3: Security headers middleware.
    /// Adds 7 essential security headers to all responses.
    /// Reference: OWASP Security Headers
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var headers = context.Response.Headers;

            // 1. Prevent MIME-sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // 2. Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";

            // 3. Enable XSS protection
            headers["X-XSS-Protection"] = "1; mode=block";

            // 4. Restrict referrer information
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // 5. Control browser features
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

            // 6. Content Security Policy
            headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;";

            // 7. Remove server header
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            await _next(context);
        }
    }

    public static class SecurityHeadersMiddlewareExtensions
    {
        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            return app.UseMiddleware<SecurityHeadersMiddleware>();
        }
    }
}
