using Polly;
using Polly.CircuitBreaker;
using StackExchange.Redis;

namespace backend.Services
{
    /// <summary>
    /// Stability M6: Redis connection with Polly Circuit Breaker.
    /// - Closed (normal): requests pass through
    /// - Open (failure detected): skip Redis, fallback to DB/memory
    /// - Half-Open (testing): allow 1 request to test recovery
    /// 
    /// Prevents cascading failures when Redis is down.
    /// </summary>
    public interface IRedisCircuitBreaker
    {
        Task<T?> ExecuteAsync<T>(Func<Task<T?>> action, T? fallback = default);
        Task ExecuteAsync(Func<Task> action);
        CircuitState State { get; }
    }

    public class RedisCircuitBreaker : IRedisCircuitBreaker
    {
        private readonly ResiliencePipeline _pipeline;
        private readonly ILogger<RedisCircuitBreaker> _logger;
        private CircuitState _lastKnownState = CircuitState.Closed;

        public CircuitState State => _lastKnownState;

        public RedisCircuitBreaker(ILogger<RedisCircuitBreaker> logger)
        {
            _logger = logger;

            _pipeline = new ResiliencePipelineBuilder()
                .AddCircuitBreaker(new CircuitBreakerStrategyOptions
                {
                    // Open circuit after 3 failures
                    FailureRatio = 0.5,
                    MinimumThroughput = 3,
                    SamplingDuration = TimeSpan.FromSeconds(30),

                    // Stay open for 30 seconds before trying
                    BreakDuration = TimeSpan.FromSeconds(30),

                    ShouldHandle = new PredicateBuilder()
                        .Handle<RedisConnectionException>()
                        .Handle<RedisTimeoutException>()
                        .Handle<TimeoutException>(),

                    OnOpened = args =>
                    {
                        _lastKnownState = CircuitState.Open;
                        logger.LogWarning(
                            "⚡ Redis Circuit OPENED — Redis unavailable. Duration: {Duration}s",
                            args.BreakDuration.TotalSeconds);
                        return ValueTask.CompletedTask;
                    },
                    OnClosed = _ =>
                    {
                        _lastKnownState = CircuitState.Closed;
                        logger.LogInformation("✅ Redis Circuit CLOSED — Redis recovered");
                        return ValueTask.CompletedTask;
                    },
                    OnHalfOpened = _ =>
                    {
                        _lastKnownState = CircuitState.HalfOpen;
                        logger.LogInformation("🔄 Redis Circuit HALF-OPEN — Testing Redis...");
                        return ValueTask.CompletedTask;
                    }
                })
                .AddTimeout(TimeSpan.FromMilliseconds(500)) // Max 500ms for Redis operations
                .Build();
        }

        public async Task<T?> ExecuteAsync<T>(Func<Task<T?>> action, T? fallback = default)
        {
            try
            {
                return await _pipeline.ExecuteAsync(async ct => await action(), CancellationToken.None);
            }
            catch (BrokenCircuitException)
            {
                _logger.LogDebug("Redis circuit is open — returning fallback");
                return fallback;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis operation failed — returning fallback");
                return fallback;
            }
        }

        public async Task ExecuteAsync(Func<Task> action)
        {
            try
            {
                await _pipeline.ExecuteAsync(async ct => await action(), CancellationToken.None);
            }
            catch (BrokenCircuitException)
            {
                _logger.LogDebug("Redis circuit is open — skipping operation");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis operation failed — skipping");
            }
        }
    }
}
