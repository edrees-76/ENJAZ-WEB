using backend.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace backend.tests.Services
{
    /// <summary>
    /// Tests for RedisCacheService — cache operations with graceful fallback.
    /// </summary>
    public class CacheServiceTests
    {
        private readonly Mock<IDistributedCache> _cacheMock;
        private readonly Mock<ILogger<RedisCacheService>> _loggerMock;
        private readonly RedisCacheService _sut;

        public CacheServiceTests()
        {
            _cacheMock = new Mock<IDistributedCache>();
            _loggerMock = new Mock<ILogger<RedisCacheService>>();
            _sut = new RedisCacheService(_cacheMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task GetAsync_CacheMiss_ReturnsDefault()
        {
            _cacheMock
                .Setup(c => c.GetAsync("missing-key", It.IsAny<CancellationToken>()))
                .ReturnsAsync((byte[]?)null);

            var result = await _sut.GetAsync<string>("missing-key");
            Assert.Null(result);
        }

        [Fact]
        public async Task SetAsync_DoesNotThrow()
        {
            await _sut.SetAsync("test-key", "test-value", TimeSpan.FromMinutes(5));
            // Should complete without exception
        }

        [Fact]
        public async Task RemoveAsync_DoesNotThrow()
        {
            await _sut.RemoveAsync("test-key");
            // Should complete without exception
        }

        [Fact]
        public async Task GetAsync_RedisDown_ReturnsDefault()
        {
            _cacheMock
                .Setup(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Redis connection refused"));

            var result = await _sut.GetAsync<string>("test-key");
            Assert.Null(result); // Graceful fallback
        }

        [Fact]
        public async Task SetAsync_RedisDown_DoesNotThrow()
        {
            _cacheMock
                .Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(),
                    It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Redis connection refused"));

            // Should not throw — graceful degradation
            await _sut.SetAsync("test-key", "test-value");
        }

        [Fact]
        public async Task RemoveByPrefixAsync_CompletesSuccessfully()
        {
            await _sut.RemoveByPrefixAsync("test:");
            // No-op but should not throw
        }
    }
}
