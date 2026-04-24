using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace backend.Controllers
{
#if DEBUG
    [ApiController]
    [Route("api/[controller]")]
    public class DevController : ControllerBase
    {
        private readonly EnjazDbContext _context;
        private readonly ILogger<DevController> _logger;
        private readonly IWebHostEnvironment _env;

        public DevController(EnjazDbContext context, ILogger<DevController> logger, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        [HttpPost("seed-stress")]
        public async Task<IActionResult> SeedStressData()
        {
            if (!_env.IsDevelopment())
            {
                return Forbid("Stress testing is only allowed in Development environment.");
            }

            var sw = Stopwatch.StartNew();
            _logger.LogInformation("Starting stress data seeding...");

            // Get a default user or use ID 1
            var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin) 
                            ?? await _context.Users.FirstOrDefaultAsync();
            var userId = adminUser?.Id ?? 1;
            var userName = adminUser?.FullName ?? "StressAdmin";

            int batchSize = 2000;
            int totalReceptions = 10000;
            
            // 1. Seed Sample Receptions and Samples
            for (int i = 0; i < totalReceptions; i += batchSize)
            {
                var receptions = new List<SampleReception>();
                for (int j = 0; j < batchSize; j++)
                {
                    int index = i + j;
                    var reception = new SampleReception
                    {
                        AnalysisRequestNumber = $"REQ-STRESS-{index}",
                        NotificationNumber = $"NOT-STRESS-{index}",
                        DeclarationNumber = $"DEC-STRESS-{index}",
                        Supplier = $"Supplier {index % 100}",
                        Sender = $"Sender {index % 50}",
                        Origin = "Local",
                        PolicyNumber = $"POL-{index}",
                        FinancialReceiptNumber = $"FIN-{index}",
                        CertificateType = "عينات بيئية",
                        Date = DateTime.UtcNow.AddDays(-(index % 365)),
                        Status = "لم يتم إصدار شهادة",
                        CreatedBy = userId,
                        CreatedByName = userName,
                        CreatedAt = DateTime.UtcNow.AddDays(-(index % 365)),
                        Samples = new List<ReceptionSample>()
                    };

                    // Add 5 samples per reception
                    for (int s = 0; s < 5; s++)
                    {
                        reception.Samples.Add(new ReceptionSample
                        {
                            SampleNumber = $"SMPL-STRESS-{index}-{s}",
                            Description = $"Stress sample {index} - {s}",
                            Root = "Root A"
                        });
                    }
                    receptions.Add(reception);
                }
                
                await _context.SampleReceptions.AddRangeAsync(receptions);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Seeded {i + batchSize} / {totalReceptions} receptions...");
                
                // Detach entities to save memory
                _context.ChangeTracker.Clear();
            }

            // 2. Seed Certificates
            int totalCertificates = 5000;
            for (int i = 0; i < totalCertificates; i += batchSize)
            {
                var certificates = new List<Certificate>();
                for (int j = 0; j < Math.Min(batchSize, totalCertificates - i); j++)
                {
                    int index = i + j;
                    var certificate = new Certificate
                    {
                        CertificateNumber = $"CERT-STRESS-{index}",
                        RecipientName = $"Recipient {index % 100}",
                        CertificateType = "عينات بيئية",
                        Description = "Stress Test Certificate",
                        IssueDate = DateTime.UtcNow.AddDays(-(index % 365)),
                        CreatedBy = userId,
                        CreatedByName = userName,
                        CreatedAt = DateTime.UtcNow.AddDays(-(index % 365)),
                        Sender = $"Sender {index % 50}",
                        Supplier = $"Supplier {index % 100}",
                        NotificationNumber = $"NOT-STRESS-{index}",
                        Samples = new List<Sample>()
                    };

                    // Add 5 samples per certificate
                    for (int s = 0; s < 5; s++)
                    {
                        certificate.Samples.Add(new Sample
                        {
                            SampleNumber = $"C-SMPL-STRESS-{index}-{s}",
                            Description = $"Cert sample {index} - {s}",
                            Root = s + 1,
                            MeasurementDate = DateTime.UtcNow.AddDays(-(index % 365)),
                            Result = "مطابق",
                            IsotopeK40 = $"{20 + (index % 50)}",
                            IsotopeRa226 = $"{5 + (index % 20)}",
                            IsotopeTh232 = $"{3 + (index % 15)}"
                        });
                    }
                    certificates.Add(certificate);
                }

                await _context.Certificates.AddRangeAsync(certificates);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Seeded {i + Math.Min(batchSize, totalCertificates - i)} / {totalCertificates} certificates...");
                
                _context.ChangeTracker.Clear();
            }

            sw.Stop();
            _logger.LogInformation($"Stress seeding completed in {sw.ElapsedMilliseconds} ms.");

            return Ok(new { 
                Message = "Stress data seeded successfully.",
                ReceptionsAdded = totalReceptions,
                SamplesAdded = totalReceptions * 5,
                CertificatesAdded = totalCertificates,
                ElapsedMilliseconds = sw.ElapsedMilliseconds
            });
        }
    }
#endif
}
