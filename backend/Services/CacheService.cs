using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace backend.Services
{
    /// <summary>
    /// Core-A M2: Redis-backed distributed cache with graceful fallback.
    /// If Redis is down, operations silently fail (cache miss → DB query).
    /// </summary>
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
        Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
        Task RemoveAsync(string key, CancellationToken ct = default);
        Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
    }

    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<RedisCacheService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        // Default TTL: 5 minutes
        private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(5);

        public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
        {
            try
            {
                var data = await _cache.GetStringAsync(key, ct);
                if (data == null)
                {
                    _logger.LogDebug("Cache MISS: {Key}", key);
                    return default;
                }

                _logger.LogDebug("Cache HIT: {Key}", key);
                return JsonSerializer.Deserialize<T>(data, _jsonOptions);
            }
            catch (Exception ex)
            {
                // Redis down → graceful fallback (cache miss)
                _logger.LogWarning(ex, "Redis GET failed for key {Key} — falling back to DB", key);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
        {
            try
            {
                var json = JsonSerializer.Serialize(value, _jsonOptions);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry
                };

                await _cache.SetStringAsync(key, json, options, ct);
                _logger.LogDebug("Cache SET: {Key} (TTL={Ttl})", key, expiry ?? DefaultExpiry);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis SET failed for key {Key} — continuing without cache", key);
            }
        }

        public async Task RemoveAsync(string key, CancellationToken ct = default)
        {
            try
            {
                await _cache.RemoveAsync(key, ct);
                _logger.LogDebug("Cache DEL: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis DEL failed for key {Key}", key);
            }
        }

        public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
        {
            // Note: StackExchange.Redis SCAN-based prefix delete is expensive.
            // For now, we use known key patterns and delete individually.
            _logger.LogDebug("Cache prefix invalidation requested: {Prefix}*", prefix);
            // This is a no-op for IDistributedCache — implement via IConnectionMultiplexer if needed.
            return Task.CompletedTask;
        }
    }
}
