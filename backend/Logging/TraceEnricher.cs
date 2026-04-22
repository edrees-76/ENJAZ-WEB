using Serilog.Core;
using Serilog.Events;
using System.Diagnostics;

namespace backend.Logging
{
    public class TraceEnricher : ILogEventEnricher
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TraceEnricher(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {
            var activity = Activity.Current;

            if (activity != null)
            {
                logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("TraceId", activity.TraceId.ToString()));
                logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SpanId", activity.SpanId.ToString()));
            }

            var correlationId = _httpContextAccessor.HttpContext?.Items["CorrelationId"]?.ToString();

            if (!string.IsNullOrEmpty(correlationId))
            {
                logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("CorrelationId", correlationId));
            }
        }
    }
}
