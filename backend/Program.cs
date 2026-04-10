using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Database: SQLite for Development, PostgreSQL for Production
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

builder.Services.AddScoped<backend.Services.ICertificateService, backend.Services.CertificateService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "a_very_long_secret_key_for_enjaz_system_12345!"))
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Automated database creation for SQLite (One-time at startup)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<EnjazDbContext>();
        db.Database.EnsureCreated();
        
        // Create missing tables if database already existed before these models were added
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS Certificates (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    CertificateNumber TEXT NOT NULL DEFAULT '',
                    RecipientName TEXT NOT NULL DEFAULT '',
                    CertificateType TEXT NOT NULL DEFAULT '',
                    Description TEXT,
                    IssueDate TEXT NOT NULL DEFAULT '0001-01-01',
                    ExpiryDate TEXT,
                    IssuingAuthority TEXT,
                    CreatedBy INTEGER NOT NULL DEFAULT 0,
                    CreatedByName TEXT,
                    CreatedAt TEXT NOT NULL DEFAULT '0001-01-01',
                    AnalysisType TEXT,
                    Sender TEXT,
                    Supplier TEXT,
                    Origin TEXT,
                    DeclarationNumber TEXT,
                    PolicyNumber TEXT,
                    NotificationNumber TEXT,
                    FinancialReceiptNumber TEXT,
                    SpecialistName TEXT,
                    SectionHeadName TEXT,
                    ManagerName TEXT,
                    Notes TEXT,
                    SampleReceptionId INTEGER,
                    FOREIGN KEY (SampleReceptionId) REFERENCES SampleReceptions(Id)
                );
            ");
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS Samples (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    CertificateId INTEGER NOT NULL,
                    Root INTEGER NOT NULL DEFAULT 0,
                    SampleNumber TEXT,
                    Description TEXT,
                    MeasurementDate TEXT,
                    Result TEXT,
                    IsotopeK40 TEXT,
                    IsotopeRa226 TEXT,
                    IsotopeTh232 TEXT,
                    IsotopeRa TEXT,
                    IsotopeCs137 TEXT,
                    FOREIGN KEY (CertificateId) REFERENCES Certificates(Id) ON DELETE CASCADE
                );
            ");
            Console.WriteLine("[DB] Certificates and Samples tables verified/created successfully.");
            db.Database.ExecuteSqlRaw(@"
                UPDATE SampleReceptions
                SET Status = 'تم إصدار شهادة'
                WHERE Id IN (
                    SELECT SampleReceptionId FROM Certificates WHERE SampleReceptionId IS NOT NULL
                );
            ");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB WARNING] Table creation check: {ex.Message}");
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
