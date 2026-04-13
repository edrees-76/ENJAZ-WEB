using backend.Data;
using backend.Services;
using backend.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Serilog;
using Serilog.Events;
using Hangfire;
using Hangfire.PostgreSql;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Asp.Versioning;

// ═══════════════════════════════════════════════
// Core-A M2: Serilog Bootstrap (before anything else)
// ═══════════════════════════════════════════════
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .MinimumLevel.Override("Hangfire", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/enjaz-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("═══════════════════════════════════════");
    Log.Information("  ENJAZ WEB v1.0.0 — Starting up...");
    Log.Information("═══════════════════════════════════════");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog as the logging provider
    builder.Host.UseSerilog();

    // ═══════════════════════════════════════════════
    // Database Configuration — PostgreSQL (unified)
    // ═══════════════════════════════════════════════
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

    builder.Services.AddDbContext<EnjazDbContext>(options =>
        options.UseNpgsql(connectionString));

    // ═══════════════════════════════════════════════
    // Core-A M2: Redis Distributed Cache
    // ═══════════════════════════════════════════════
    var redisConnection = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "enjaz:";
    });
    builder.Services.AddSingleton<ICacheService, RedisCacheService>();

    // ═══════════════════════════════════════════════
    // Core-A M2: Hangfire Background Jobs
    // ═══════════════════════════════════════════════
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UsePostgreSqlStorage(opts =>
            opts.UseNpgsqlConnection(connectionString)));

    builder.Services.AddHangfireServer(opts =>
    {
        opts.WorkerCount = 2;
        opts.Queues = new[] { "critical", "default", "low" };
    });

    // ═══════════════════════════════════════════════
    // Application Services Registration
    // ═══════════════════════════════════════════════

    // Existing services
    builder.Services.AddScoped<ICertificateService, CertificateService>();
    builder.Services.AddScoped<ReportService>();
    builder.Services.AddScoped<ExcelExportService>();
    builder.Services.AddScoped<PdfExportService>();
    builder.Services.AddScoped<ReferralPdfService>();

    // User Management services
    builder.Services.AddSingleton<PasswordService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IAuditLogService, AuditLogService>();

    // Settings & System Management
    builder.Services.AddScoped<ISettingsService, SettingsService>();
    builder.Services.AddScoped<IAlertService, AlertService>();
    builder.Services.AddHostedService<AutoBackupHostedService>();
    builder.Services.AddHostedService<backend.BackgroundServices.AlertBackgroundService>();

    // Core-A M2: Data Retention service
    builder.Services.AddScoped<IDataRetentionService, DataRetentionService>();

    // Rate Limiting — IMemoryCache-based (swappable to Redis)
    builder.Services.AddMemoryCache();
    builder.Services.AddSingleton<ILoginRateLimiter, MemoryCacheRateLimiter>();

    // Stability M5: Business Metrics
    builder.Services.AddSingleton<MetricsService>();

    // Stability M6: Redis Circuit Breaker
    builder.Services.AddSingleton<IRedisCircuitBreaker, RedisCircuitBreaker>();

    // Stability M6: Feature Flags
    builder.Services.AddScoped<IFeatureFlagService, FeatureFlagService>();

    // ═══════════════════════════════════════════════
    // CORS Configuration
    // ═══════════════════════════════════════════════
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://localhost:3000")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials(); // Required for HttpOnly cookies
        });
    });

    // ═══════════════════════════════════════════════
    // JWT Authentication (Access Token: 30 minutes)
    // ═══════════════════════════════════════════════
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            var jwtKey = builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is missing from configuration.");

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkew = TimeSpan.FromSeconds(30), // Reduced from default 5 minutes
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };

            // SignalR WebSocket Auth: Browser WebSocket API cannot send Authorization headers,
            // so the token is passed via query string (?access_token=xxx).
            // Path narrowed to /hubs/alerts to minimize attack surface.
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken)
                        && path.StartsWithSegments("/hubs/alerts"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

    // ═══════════════════════════════════════════════
    // Authorization Policies
    // ═══════════════════════════════════════════════
    builder.Services.AddAuthorizationBuilder()
        .AddPolicy("AdminOnly", p => p.RequireRole("Admin"))
        .AddPolicy("UserOrAdmin", p => p.RequireRole("User", "Admin"));

    // ═══════════════════════════════════════════════
    // Core-B 3.1: API Versioning (Asp.Versioning)
    // ═══════════════════════════════════════════════
    builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true; // api-supported-versions header
        options.ApiVersionReader = ApiVersionReader.Combine(
            new UrlSegmentApiVersionReader(),
            new HeaderApiVersionReader("X-Api-Version"));
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

    // ═══════════════════════════════════════════════
    // Controllers + JSON Options
    // ═══════════════════════════════════════════════
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddSignalR();

    // ═══════════════════════════════════════════════
    // Health Checks — DB + Redis
    // ═══════════════════════════════════════════════
    builder.Services.AddHealthChecks()
        .AddNpgSql(connectionString, name: "database", tags: ["ready"])
        .AddRedis(redisConnection, name: "redis", tags: ["ready"]);

    // ═══════════════════════════════════════════════
    // Stability M5: OpenTelemetry + Prometheus Metrics
    // ═══════════════════════════════════════════════
    builder.Services.AddOpenTelemetry()
        .ConfigureResource(r => r.AddService("Enjaz.Api", serviceVersion: "1.0.0"))
        .WithMetrics(metrics =>
        {
            metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddMeter(MetricsService.MeterName)
                .AddPrometheusExporter();
        });

    var app = builder.Build();

    // ═══════════════════════════════════════════════
    // Startup Initialization
    // ═══════════════════════════════════════════════
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<EnjazDbContext>();

        if (app.Environment.IsDevelopment())
        {
            // Auto-apply pending migrations at startup
            db.Database.Migrate();
        }

        // Ensure default admin exists
        var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
        await userService.EnsureDefaultAdminAsync();
    }

    // ═══════════════════════════════════════════════
    // HTTP Pipeline
    // ═══════════════════════════════════════════════

    // Core-A M2: Global exception handler (first in pipeline)
    app.UseGlobalExceptionHandler();

    // Core-B M3: Security headers (before anything else)
    app.UseSecurityHeaders();

    // Core-A M2: Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
            diagnosticContext.Set("UserId", httpContext.User?.FindFirst("sub")?.Value ?? "anonymous");
        };
    });

    // Core-B M3: Swagger disabled in Production (3.6)
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors("AllowAll");

    // Core-B M3: Rate Limiting (before auth to block abusers early)
    app.UseApiRateLimiting();

    app.UseAuthentication();
    app.UseAuthorization();

    // Core-B M3: Idempotency (after auth, before controllers)
    app.UseIdempotency();

    // Log mutating actions globally
    app.UseGlobalAuditLogging();

    app.MapControllers();
    app.MapHub<backend.Hubs.AlertHub>("/hubs/alerts/v1");
    app.MapHealthChecks("/health");

    // Stability M5: Prometheus metrics endpoint
    app.MapPrometheusScrapingEndpoint("/metrics");

    // Core-A M2: Hangfire Dashboard (admin-only, dev only)
    if (app.Environment.IsDevelopment())
    {
        app.MapHangfireDashboard("/hangfire");
    }

    // ═══════════════════════════════════════════════
    // Core-A M2: Schedule Recurring Jobs
    // ═══════════════════════════════════════════════
    RecurringJob.AddOrUpdate<IDataRetentionService>(
        "data-retention-daily",
        service => service.RunFullCleanupAsync(CancellationToken.None),
        Cron.Daily(3, 0), // Run at 3:00 AM
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

    Log.Information("═══════════════════════════════════════");
    Log.Information("  ENJAZ WEB v1.0.0 — Ready ✅");
    Log.Information("  Health:  http://localhost:5144/health");
    Log.Information("  Metrics: http://localhost:5144/metrics");
    Log.Information("═══════════════════════════════════════");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "ENJAZ WEB — Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
