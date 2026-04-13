using System.Diagnostics.Metrics;

namespace backend.Services
{
    /// <summary>
    /// Stability M5: Custom business metrics exposed via OpenTelemetry/Prometheus.
    /// Tracks certificates issued, samples received, auth events, cache hit rates, etc.
    /// 
    /// Prometheus endpoint: /metrics
    /// </summary>
    public sealed class MetricsService
    {
        public static readonly string MeterName = "Enjaz.Api";

        private readonly Counter<long> _certificatesIssued;
        private readonly Counter<long> _samplesReceived;
        private readonly Counter<long> _loginSuccess;
        private readonly Counter<long> _loginFailed;
        private readonly Counter<long> _httpRequests;
        private readonly Counter<long> _httpErrors;
        private readonly Histogram<double> _requestDuration;
        private readonly Counter<long> _cacheHits;
        private readonly Counter<long> _cacheMisses;
        private readonly Counter<long> _pdfGenerated;
        private readonly Counter<long> _rateLimitRejected;

        public MetricsService(IMeterFactory meterFactory)
        {
            var meter = meterFactory.Create(MeterName);

            _certificatesIssued = meter.CreateCounter<long>(
                "enjaz_certificates_issued_total",
                description: "Total certificates issued");

            _samplesReceived = meter.CreateCounter<long>(
                "enjaz_samples_received_total",
                description: "Total sample receptions created");

            _loginSuccess = meter.CreateCounter<long>(
                "enjaz_auth_login_success_total",
                description: "Total successful logins");

            _loginFailed = meter.CreateCounter<long>(
                "enjaz_auth_login_failed_total",
                description: "Total failed login attempts");

            _httpRequests = meter.CreateCounter<long>(
                "enjaz_http_requests_total",
                description: "Total HTTP requests processed");

            _httpErrors = meter.CreateCounter<long>(
                "enjaz_http_errors_total",
                description: "Total HTTP 5xx errors");

            _requestDuration = meter.CreateHistogram<double>(
                "enjaz_http_request_duration_seconds",
                unit: "s",
                description: "HTTP request duration in seconds");

            _cacheHits = meter.CreateCounter<long>(
                "enjaz_cache_hits_total",
                description: "Total cache hits");

            _cacheMisses = meter.CreateCounter<long>(
                "enjaz_cache_misses_total",
                description: "Total cache misses");

            _pdfGenerated = meter.CreateCounter<long>(
                "enjaz_pdf_generated_total",
                description: "Total PDF documents generated");

            _rateLimitRejected = meter.CreateCounter<long>(
                "enjaz_ratelimit_rejected_total",
                description: "Total rate-limited requests");
        }

        // Business Metrics
        public void CertificateIssued(string type) =>
            _certificatesIssued.Add(1, new KeyValuePair<string, object?>("type", type));

        public void SampleReceived() => _samplesReceived.Add(1);

        // Auth Metrics
        public void LoginSuccess() => _loginSuccess.Add(1);
        public void LoginFailed(string reason) =>
            _loginFailed.Add(1, new KeyValuePair<string, object?>("reason", reason));

        // HTTP Metrics
        public void HttpRequest(string method, string path, int statusCode, double durationMs)
        {
            _httpRequests.Add(1,
                new KeyValuePair<string, object?>("method", method),
                new KeyValuePair<string, object?>("status", statusCode));

            _requestDuration.Record(durationMs / 1000.0,
                new KeyValuePair<string, object?>("method", method),
                new KeyValuePair<string, object?>("path", path));

            if (statusCode >= 500)
                _httpErrors.Add(1);
        }

        // Cache Metrics
        public void CacheHit() => _cacheHits.Add(1);
        public void CacheMiss() => _cacheMisses.Add(1);

        // PDF Metrics
        public void PdfGenerated(string type) =>
            _pdfGenerated.Add(1, new KeyValuePair<string, object?>("type", type));

        // Rate Limit
        public void RateLimitRejected() => _rateLimitRejected.Add(1);
    }
}
