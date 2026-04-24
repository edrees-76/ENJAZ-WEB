using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using backend.Data;
using backend.Models;

namespace backend.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly EnjazDbContext _context;
        private readonly IMemoryCache _cache;

        public DashboardService(EnjazDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<DashboardStatsDto> GetStatsAsync(string period, string timezone, int? targetYear = null)
        {
            var yearKey = targetYear?.ToString() ?? "current";
            var cacheKey = $"dashboard_stats_{period}_{yearKey}";

            if (_cache.TryGetValue(cacheKey, out DashboardStatsDto cachedData))
            {
                return cachedData;
            }

            var todayUtc = DateTime.UtcNow.Date;
            var currentYear = todayUtc.Year;
            
            // If targetYear is provided and it's in the past, adjust the end point to Dec 31st of that year
            if (targetYear.HasValue && targetYear.Value < currentYear)
            {
                todayUtc = new DateTime(targetYear.Value, 12, 31, 0, 0, 0, DateTimeKind.Utc);
            }

            DateTime startDate;

            switch (period.ToLower())
            {
                case "today":
                    startDate = todayUtc;
                    break;
                case "week":
                    startDate = todayUtc.AddDays(-6);
                    break;
                case "month":
                    startDate = todayUtc.AddDays(-29);
                    break;
                case "year":
                default:
                    if (targetYear.HasValue)
                        startDate = new DateTime(targetYear.Value, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                    else
                        startDate = new DateTime(todayUtc.Year, todayUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
                    break;
            }

            // Totals
            var totalSamples = await _context.ReceptionSamples.CountAsync();
            var samplesToday = await _context.ReceptionSamples
                .CountAsync(s => s.SampleReception != null && s.SampleReception.Date.Date == todayUtc);
            
            var samplesEnv = await _context.SampleReceptions
                .Where(s => s.CertificateType.Contains("بيئية"))
                .SelectMany(r => r.Samples)
                .CountAsync();
                
            var samplesCons = await _context.SampleReceptions
                .Where(s => s.CertificateType.Contains("استهلاكية"))
                .SelectMany(r => r.Samples)
                .CountAsync();

            var certQuery = _context.Certificates.AsQueryable();
            var totalCerts = await certQuery.CountAsync();
            var certsToday = await certQuery.CountAsync(c => c.IssueDate.Date == todayUtc);
            var certsEnv = await certQuery.CountAsync(c => c.CertificateType.Contains("بيئية"));
            var certsCons = await certQuery.CountAsync(c => c.CertificateType.Contains("استهلاكية"));

            // Get filtered raw data for charts
            var rawSamples = await _context.SampleReceptions
                .Where(s => s.Date >= startDate)
                .SelectMany(s => s.Samples, (reception, sample) => new 
                {
                    reception.Date,
                    reception.CertificateType
                })
                .ToListAsync();

            var rawCerts = await _context.Certificates
                .Where(c => c.IssueDate >= startDate)
                .Select(c => new { Date = c.IssueDate, c.CertificateType })
                .ToListAsync();

            var chartSamples = GenerateChartData(rawSamples.Select(x => (x.Date, x.CertificateType)), period, startDate, todayUtc);
            var chartCerts = GenerateChartData(rawCerts.Select(x => (x.Date, x.CertificateType)), period, startDate, todayUtc);

            var result = new DashboardStatsDto
            {
                TotalSamples = totalSamples,
                SamplesToday = samplesToday,
                SamplesEnvironmental = samplesEnv,
                SamplesConsumable = samplesCons,
                TotalCertificates = totalCerts,
                CertificatesToday = certsToday,
                CertificatesEnvironmental = certsEnv,
                CertificatesConsumable = certsCons,
                ChartSamples = chartSamples,
                ChartCertificates = chartCerts
            };

            var ttl = GetTTL(period);
            _cache.Set(cacheKey, result, ttl);

            return result;
        }

        private TimeSpan GetTTL(string period)
        {
            return period.ToLower() switch
            {
                "today" => TimeSpan.FromMinutes(1),
                "week" => TimeSpan.FromMinutes(5),
                "month" => TimeSpan.FromMinutes(10),
                _ => TimeSpan.FromMinutes(30)
            };
        }

        private List<ChartDataPoint> GenerateChartData(IEnumerable<(DateTime Date, string Type)> data, string period, DateTime startDate, DateTime todayUtc)
        {
            var result = new List<ChartDataPoint>();

            if (period == "today")
            {
                // Group by hour
                var grouped = data.Where(d => d.Date.Date == todayUtc)
                                  .GroupBy(d => d.Date.Hour)
                                  .ToDictionary(g => g.Key, g => g.ToList());
                
                for (int i = 0; i < 24; i+=2) // Every 2 hours to fit chart
                {
                    var items = grouped.ContainsKey(i) ? grouped[i] : new();
                    var itemsNext = grouped.ContainsKey(i+1) ? grouped[i+1] : new();
                    var combined = items.Concat(itemsNext);
                    
                    result.Add(new ChartDataPoint
                    {
                        Label = $"{i:D2}:00",
                        Environmental = combined.Count(x => x.Type.Contains("بيئية")),
                        Consumable = combined.Count(x => x.Type.Contains("استهلاكية"))
                    });
                }
            }
            else if (period == "week")
            {
                // Last 7 days
                var daysMap = new string[] { "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت" };
                for (int i = 0; i < 7; i++)
                {
                    var targetDate = startDate.AddDays(i);
                    var items = data.Where(d => d.Date.Date == targetDate).ToList();
                    
                    result.Add(new ChartDataPoint
                    {
                        Label = daysMap[(int)targetDate.DayOfWeek],
                        Environmental = items.Count(x => x.Type.Contains("بيئية")),
                        Consumable = items.Count(x => x.Type.Contains("استهلاكية"))
                    });
                }
            }
            else if (period == "month")
            {
                // Last 4 weeks approximately, or group by every 5 days
                for (int i = 0; i < 6; i++)
                {
                    var startInterval = startDate.AddDays(i * 5);
                    var endInterval = startInterval.AddDays(4);
                    var items = data.Where(d => d.Date.Date >= startInterval && d.Date.Date <= endInterval).ToList();
                    
                    result.Add(new ChartDataPoint
                    {
                        Label = $"{startInterval.Day}/{startInterval.Month}",
                        Environmental = items.Count(x => x.Type.Contains("بيئية")),
                        Consumable = items.Count(x => x.Type.Contains("استهلاكية"))
                    });
                }
            }
            else
            {
                // Year: Last 12 months
                var monthsMap = new string[] { "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر" };
                for (int i = 0; i < 12; i++)
                {
                    var targetMonth = startDate.AddMonths(i);
                    var monthLabel = monthsMap[targetMonth.Month - 1];
                    var items = data.Where(d => d.Date.Year == targetMonth.Year && d.Date.Month == targetMonth.Month).ToList();
                    
                    result.Add(new ChartDataPoint
                    {
                        Label = monthLabel,
                        Environmental = items.Count(x => x.Type.Contains("بيئية")),
                        Consumable = items.Count(x => x.Type.Contains("استهلاكية"))
                    });
                }
            }

            return result;
        }
    }
}
