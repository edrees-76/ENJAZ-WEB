using backend.Data;
using backend.Services;
using backend.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ═══════════════════════════════════════════════
// Database Configuration
// ═══════════════════════════════════════════════
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<EnjazDbContext>(options =>
        options.UseSqlite("Data Source=enjaz.db"));
}
else
{
    builder.Services.AddDbContext<EnjazDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

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

// Rate Limiting — IMemoryCache-based (swappable to Redis)
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ILoginRateLimiter, MemoryCacheRateLimiter>();

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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Log mutating actions globally
app.UseGlobalAuditLogging();

app.MapControllers();
app.MapHub<backend.Hubs.AlertHub>("/hubs/alerts/v1");

app.Run();
