using backend.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace backend.tests.Middleware
{
    /// <summary>
    /// Tests for SecurityHeadersMiddleware — OWASP security headers.
    /// </summary>
    public class SecurityHeadersMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_AddsXContentTypeOptions()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Equal("nosniff", context.Response.Headers["X-Content-Type-Options"]);
        }

        [Fact]
        public async Task InvokeAsync_AddsXFrameOptions()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Equal("DENY", context.Response.Headers["X-Frame-Options"]);
        }

        [Fact]
        public async Task InvokeAsync_AddsXXSSProtection()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Equal("1; mode=block", context.Response.Headers["X-XSS-Protection"]);
        }

        [Fact]
        public async Task InvokeAsync_AddsReferrerPolicy()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Equal("strict-origin-when-cross-origin", context.Response.Headers["Referrer-Policy"]);
        }

        [Fact]
        public async Task InvokeAsync_AddsPermissionsPolicy()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Contains("camera=()", context.Response.Headers["Permissions-Policy"].ToString());
        }

        [Fact]
        public async Task InvokeAsync_AddsCSPHeader()
        {
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => Task.CompletedTask);

            await middleware.InvokeAsync(context);

            Assert.Contains("default-src 'self'", context.Response.Headers["Content-Security-Policy"].ToString());
        }

        [Fact]
        public async Task InvokeAsync_CallsNext()
        {
            var nextCalled = false;
            var context = new DefaultHttpContext();
            var middleware = new SecurityHeadersMiddleware(
                next: (_) => { nextCalled = true; return Task.CompletedTask; });

            await middleware.InvokeAsync(context);

            Assert.True(nextCalled);
        }
    }

    /// <summary>
    /// Tests for GlobalExceptionMiddleware — unified error handling.
    /// </summary>
    public class GlobalExceptionMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_NoException_PassesThrough()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            var loggerMock = new Mock<ILogger<GlobalExceptionMiddleware>>();

            var middleware = new GlobalExceptionMiddleware(
                next: (_) => Task.CompletedTask,
                logger: loggerMock.Object);

            await middleware.InvokeAsync(context);

            Assert.Equal(200, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_ArgumentException_Returns400()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            var loggerMock = new Mock<ILogger<GlobalExceptionMiddleware>>();

            var middleware = new GlobalExceptionMiddleware(
                next: (_) => throw new ArgumentException("bad input"),
                logger: loggerMock.Object);

            await middleware.InvokeAsync(context);

            Assert.Equal(400, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_KeyNotFoundException_Returns404()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            var loggerMock = new Mock<ILogger<GlobalExceptionMiddleware>>();

            var middleware = new GlobalExceptionMiddleware(
                next: (_) => throw new KeyNotFoundException("not found"),
                logger: loggerMock.Object);

            await middleware.InvokeAsync(context);

            Assert.Equal(404, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_UnhandledException_Returns500()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            var loggerMock = new Mock<ILogger<GlobalExceptionMiddleware>>();

            var middleware = new GlobalExceptionMiddleware(
                next: (_) => throw new Exception("unexpected error"),
                logger: loggerMock.Object);

            await middleware.InvokeAsync(context);

            Assert.Equal(500, context.Response.StatusCode);
        }
    }
}
