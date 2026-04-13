using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace backend.Services
{
    /// <summary>
    /// Stability M6: Feature Flag entity stored in database.
    /// </summary>
    public class FeatureFlag
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public required string Key { get; set; }

        public bool IsEnabled { get; set; } = false;

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Stability M6: Feature Flag service with DB storage + Redis cache.
    /// Check feature availability at runtime without redeploying.
    /// 
    /// Usage in controllers:
    ///   if (await _features.IsEnabledAsync("dark-mode")) { ... }
    /// </summary>
    public interface IFeatureFlagService
    {
        Task<bool> IsEnabledAsync(string key);
        Task<List<FeatureFlag>> GetAllAsync();
        Task SetAsync(string key, bool enabled, string? description = null);
    }

    public class FeatureFlagService : IFeatureFlagService
    {
        private readonly EnjazDbContext _db;
        private readonly IDistributedCache _cache;
        private readonly ILogger<FeatureFlagService> _logger;
        private const string CachePrefix = "ff:";
        private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

        public FeatureFlagService(
            EnjazDbContext db,
            IDistributedCache cache,
            ILogger<FeatureFlagService> logger)
        {
            _db = db;
            _cache = cache;
            _logger = logger;
        }

        public async Task<bool> IsEnabledAsync(string key)
        {
            try
            {
                // Check cache first
                var cached = await _cache.GetStringAsync($"{CachePrefix}{key}");
                if (cached != null)
                    return cached == "1";
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Cache miss for feature flag {Key}", key);
            }

            // Check DB
            var flag = await _db.Set<FeatureFlag>()
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Key == key);

            var enabled = flag?.IsEnabled ?? false;

            // Cache result
            try
            {
                await _cache.SetStringAsync(
                    $"{CachePrefix}{key}",
                    enabled ? "1" : "0",
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTtl });
            }
            catch { /* Redis down — continue without cache */ }

            return enabled;
        }

        public async Task<List<FeatureFlag>> GetAllAsync()
        {
            return await _db.Set<FeatureFlag>()
                .AsNoTracking()
                .OrderBy(f => f.Key)
                .ToListAsync();
        }

        public async Task SetAsync(string key, bool enabled, string? description = null)
        {
            var flag = await _db.Set<FeatureFlag>()
                .FirstOrDefaultAsync(f => f.Key == key);

            if (flag == null)
            {
                flag = new FeatureFlag
                {
                    Key = key,
                    IsEnabled = enabled,
                    Description = description
                };
                _db.Set<FeatureFlag>().Add(flag);
            }
            else
            {
                flag.IsEnabled = enabled;
                flag.UpdatedAt = DateTime.UtcNow;
                if (description != null)
                    flag.Description = description;
            }

            await _db.SaveChangesAsync();

            // Invalidate cache
            try
            {
                await _cache.RemoveAsync($"{CachePrefix}{key}");
            }
            catch { /* Redis down — cache will expire naturally */ }

            _logger.LogInformation("Feature flag '{Key}' set to {Enabled}", key, enabled);
        }
    }
}
