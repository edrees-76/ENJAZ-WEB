using Microsoft.Extensions.Caching.Memory;

namespace backend.Services
{
    /// <summary>
    /// واجهة حماية القوة الغاشمة — abstraction لتسهيل الانتقال لـ Redis لاحقاً
    /// </summary>
    public interface ILoginRateLimiter
    {
        /// <summary>هل المفتاح مقفل حالياً</summary>
        bool IsLockedOut(string key);

        /// <summary>تسجيل محاولة فاشلة</summary>
        void RecordFailure(string key);

        /// <summary>إعادة ضبط العداد (بعد دخول ناجح)</summary>
        void Reset(string key);

        /// <summary>المدة المتبقية للقفل (null = غير مقفل)</summary>
        TimeSpan? GetRemainingLockout(string key);

        /// <summary>عدد المحاولات المتبقية قبل القفل (null = مقفل)</summary>
        int? GetRemainingAttempts(string key);
    }

    /// <summary>
    /// تنفيذ Rate Limiting باستخدام IMemoryCache — قابل للاستبدال بـ Redis
    /// </summary>
    public class MemoryCacheRateLimiter : ILoginRateLimiter
    {
        private readonly IMemoryCache _cache;
        private const int MaxAttempts = 5;
        private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(5);

        public MemoryCacheRateLimiter(IMemoryCache cache)
        {
            _cache = cache;
        }

        public bool IsLockedOut(string key)
        {
            if (Environment.GetEnvironmentVariable("ENJAZ_SKIP_AUTH_RATE_LIMIT") == "true")
            {
                return false;
            }
            return _cache.TryGetValue($"lockout:{key}", out _);
        }

        public void RecordFailure(string key)
        {
            if (Environment.GetEnvironmentVariable("ENJAZ_SKIP_AUTH_RATE_LIMIT") == "true")
            {
                return;
            }
            var attemptsKey = $"attempts:{key}";
            var attempts = _cache.GetOrCreate(attemptsKey, entry =>
            {
                entry.SlidingExpiration = LockoutDuration;
                return 0;
            });

            attempts++;
            _cache.Set(attemptsKey, attempts, new MemoryCacheEntryOptions
            {
                SlidingExpiration = LockoutDuration
            });

            if (attempts >= MaxAttempts)
            {
                // Activate lockout
                _cache.Set($"lockout:{key}", true, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = LockoutDuration
                });
            }
        }

        public void Reset(string key)
        {
            _cache.Remove($"attempts:{key}");
            _cache.Remove($"lockout:{key}");
        }

        public TimeSpan? GetRemainingLockout(string key)
        {
            // IMemoryCache doesn't expose TTL directly
            // Return full lockout duration if locked, null otherwise
            if (IsLockedOut(key))
            {
                return LockoutDuration;
            }
            return null;
        }

        public int? GetRemainingAttempts(string key)
        {
            if (IsLockedOut(key)) return null;

            var attemptsKey = $"attempts:{key}";
            if (_cache.TryGetValue<int>(attemptsKey, out var attempts))
            {
                return Math.Max(0, MaxAttempts - attempts);
            }
            return MaxAttempts;
        }
    }
}
