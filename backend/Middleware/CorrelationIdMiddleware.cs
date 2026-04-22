using System.Diagnostics;

namespace backend.Middleware
{
    public class CorrelationIdMiddleware
    {
        private readonly RequestDelegate _next;
        private const string HeaderName = "X-Correlation-ID";

        public CorrelationIdMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            // Fetch or create CorrelationId
            var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                                ?? Guid.NewGuid().ToString();

            context.Items["CorrelationId"] = correlationId;
            context.Response.Headers[HeaderName] = correlationId;

            // Link with Activity (Trace)
            Activity.Current?.SetTag("correlationId", correlationId);

            await _next(context);
        }
    }
}
