using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Asp.Versioning;

namespace backend.Controllers
{
    // Temporarily disabled for testing
    // [Authorize]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly Data.EnjazDbContext _context;

        public DashboardController(Data.EnjazDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try 
            {
                var today = DateTime.UtcNow.Date;
                var twelveMonthsAgo = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);

                // Basic Sample Stats (Counting actual samples, not just receptions)
                var totalSamples = await _context.ReceptionSamples.CountAsync();
                var samplesToday = await _context.ReceptionSamples
                    .CountAsync(s => s.SampleReception != null && s.SampleReception.Date.Date == today);
                
                var samplesEnv = await _context.SampleReceptions
                    .Where(s => s.CertificateType.Contains("بيئية"))
                    .SelectMany(r => r.Samples)
                    .CountAsync();
                    
                var samplesCons = await _context.SampleReceptions
                    .Where(s => s.CertificateType.Contains("استهلاكية"))
                    .SelectMany(r => r.Samples)
                    .CountAsync();

                // Basic Certificate Stats
                var certQuery = _context.Certificates.AsQueryable();
                var totalCerts = await certQuery.CountAsync();
                var certsToday = await certQuery.CountAsync(c => c.IssueDate.Date == today);
                var certsEnv = await certQuery.CountAsync(c => c.CertificateType.Contains("بيئية"));
                var certsCons = await certQuery.CountAsync(c => c.CertificateType.Contains("استهلاكية"));

                // Monthly Samples (Based on Reception Date)
                var monthlySamplesQuery = _context.SampleReceptions
                    .Where(s => s.Date >= twelveMonthsAgo)
                    .SelectMany(s => s.Samples, (reception, sample) => new 
                    {
                        reception.Date,
                        reception.CertificateType
                    });

                var monthlySamplesData = await monthlySamplesQuery.ToListAsync();

                var monthlySamples = monthlySamplesData
                    .GroupBy(x => new { x.Date.Year, x.Date.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Env = g.Count(x => x.CertificateType.Contains("بيئية")),
                        Cons = g.Count(x => x.CertificateType.Contains("استهلاكية"))
                    })
                    .ToList();

                // Monthly Certificates (Based on Issue Date)
                var monthlyCertsData = await _context.Certificates
                    .Where(c => c.IssueDate >= twelveMonthsAgo)
                    .Select(c => new { c.IssueDate, c.CertificateType })
                    .ToListAsync();

                var monthlyCerts = monthlyCertsData
                    .GroupBy(c => new { c.IssueDate.Year, c.IssueDate.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Env = g.Count(c => c.CertificateType.Contains("بيئية")),
                        Cons = g.Count(c => c.CertificateType.Contains("استهلاكية"))
                    })
                    .ToList();

                // Format Monthly Stats for Frontend
                var monthsMap = new string[] { "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر" };
                
                var formattedMonthlySamples = new List<MonthlyStat>();
                var formattedMonthlyCerts = new List<MonthlyStat>();

                for (int i = 0; i < 12; i++)
                {
                    var targetMonth = twelveMonthsAgo.AddMonths(i);
                    var monthLabel = monthsMap[targetMonth.Month - 1];

                    var sampleStat = monthlySamples.FirstOrDefault(ms => ms.Year == targetMonth.Year && ms.Month == targetMonth.Month);
                    formattedMonthlySamples.Add(new MonthlyStat
                    {
                        Month = monthLabel,
                        Environmental = sampleStat?.Env ?? 0,
                        Consumable = sampleStat?.Cons ?? 0
                    });

                    var certStat = monthlyCerts.FirstOrDefault(mc => mc.Year == targetMonth.Year && mc.Month == targetMonth.Month);
                    formattedMonthlyCerts.Add(new MonthlyStat
                    {
                        Month = monthLabel,
                        Environmental = certStat?.Env ?? 0,
                        Consumable = certStat?.Cons ?? 0
                    });
                }

                return Ok(new DashboardStatsDto
                {
                    TotalSamples = totalSamples,
                    SamplesToday = samplesToday,
                    SamplesEnvironmental = samplesEnv,
                    SamplesConsumable = samplesCons,
                    TotalCertificates = totalCerts,
                    CertificatesToday = certsToday,
                    CertificatesEnvironmental = certsEnv,
                    CertificatesConsumable = certsCons,
                    MonthlySamples = formattedMonthlySamples,
                    MonthlyCertificates = formattedMonthlyCerts
                });
            }
            catch (Exception ex)
            {
                var fullError = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return StatusCode(500, new { message = fullError, stackTrace = ex.StackTrace });
            }
        }
    }
}
