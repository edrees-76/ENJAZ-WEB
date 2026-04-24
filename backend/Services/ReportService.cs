using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Services
{
    /// <summary>
    /// خدمة التقارير المركزية - تحتوي على كل منطق تجميع البيانات والمخططات
    /// </summary>
    public class ReportService
    {
        private readonly EnjazDbContext _context;
        private readonly ILogger<ReportService> _logger;

        public ReportService(EnjazDbContext context, ILogger<ReportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// استخراج الملخص الإحصائي والمخططات البيانية
        /// </summary>
        public async Task<ReportSummaryDto> GetSummaryAsync(ReportRequest request)
        {
            var query = _context.Certificates
                .AsNoTracking()
                .Where(c => c.IssueDate >= request.StartDate && c.IssueDate <= request.EndDate);

            // فلتر الجهة المرسلة (اختياري)
            if (!string.IsNullOrWhiteSpace(request.Sender))
            {
                query = query.Where(c => c.Sender == request.Sender);
            }

            // === الإحصائيات الرئيسية ===
            var certificates = await query
                .Select(c => new
                {
                    c.CertificateType,
                    c.AnalysisType,
                    c.Sender,
                    c.Supplier,
                    c.Origin,
                    c.IssueDate,
                    SampleCount = c.Samples.Count
                })
                .ToListAsync();

            var totalCerts = certificates.Count;
            var envCerts = certificates.Count(c => c.CertificateType.Contains("بيئية"));
            var consCerts = certificates.Count(c => c.CertificateType.Contains("استهلاكية"));

            // عدد العينات
            var totalSamples = certificates.Sum(c => c.SampleCount);
            var envSamples = await query
                .Where(c => c.CertificateType.Contains("بيئية"))
                .SelectMany(c => c.Samples)
                .CountAsync();
            var consSamples = await query
                .Where(c => c.CertificateType.Contains("استهلاكية"))
                .SelectMany(c => c.Samples)
                .CountAsync();

            // === المخطط الزمني (Timeline) ===
            var daysDiff = (request.EndDate - request.StartDate).TotalDays;
            List<ReportChartDataPoint> timeline;

            if (daysDiff <= 60)
            {
                // تجميع يومي
                timeline = certificates
                    .GroupBy(c => c.IssueDate.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new ReportChartDataPoint
                    {
                        Label = g.Key.ToString("MM/dd"),
                        Value = g.Sum(c => c.SampleCount),
                        Value2 = g.Count()
                    })
                    .ToList();
            }
            else
            {
                // تجميع شهري
                timeline = certificates
                    .GroupBy(c => new { c.IssueDate.Year, c.IssueDate.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g => new ReportChartDataPoint
                    {
                        Label = GetArabicMonth(g.Key.Month),
                        Value = g.Sum(c => c.SampleCount),
                        Value2 = g.Count()
                    })
                    .ToList();
            }

            // === توزيع أنواع الشهادات (Pie Chart) ===
            var certDistribution = new List<ReportChartDataPoint>
            {
                new ReportChartDataPoint { Label = "بيئية", Value = envCerts },
                new ReportChartDataPoint { Label = "استهلاكية", Value = consCerts }
            };

            // === أعلى 7 موردين (Bar Chart) ===
            var topSuppliers = certificates
                .Where(c => !string.IsNullOrWhiteSpace(c.Supplier))
                .GroupBy(c => c.Supplier!)
                .OrderByDescending(g => g.Count())
                .Take(7)
                .Select(g => new ReportChartDataPoint { Label = g.Key, Value = g.Count() })
                .ToList();

            // === أبرز 5 جهات مرسلة (Pie Chart) ===
            var topSenders = certificates
                .Where(c => !string.IsNullOrWhiteSpace(c.Sender))
                .GroupBy(c => c.Sender!)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new ReportChartDataPoint { Label = g.Key, Value = g.Count() })
                .ToList();

            // === أهم 7 دول منشأ (Bar Chart) ===
            var topOrigins = certificates
                .Where(c => !string.IsNullOrWhiteSpace(c.Origin))
                .GroupBy(c => c.Origin!)
                .OrderByDescending(g => g.Count())
                .Take(7)
                .Select(g => new ReportChartDataPoint { Label = g.Key, Value = g.Count() })
                .ToList();

            // === الأداء الشهري على مدار السنة ===
            var monthlyPerformance = certificates
                .GroupBy(c => new { c.IssueDate.Year, c.IssueDate.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new ReportChartDataPoint
                {
                    Label = GetArabicMonth(g.Key.Month),
                    Value = g.Count(c => c.CertificateType.Contains("بيئية")),
                    Value2 = g.Count(c => c.CertificateType.Contains("استهلاكية"))
                })
                .ToList();

            // === مقارنة أنواع العينات (بيئي vs استهلاكي) ===
            var sampleTypeComparison = new List<ReportChartDataPoint>
            {
                new ReportChartDataPoint { Label = "بيئية", Value = envSamples },
                new ReportChartDataPoint { Label = "استهلاكية", Value = consSamples }
            };

            // === تحليل السلع (أعلى أنواع التحليل) ===
            var topAnalysisTypes = certificates
                .Where(c => !string.IsNullOrWhiteSpace(c.AnalysisType))
                .GroupBy(c => c.AnalysisType!)
                .OrderByDescending(g => g.Count())
                .Take(7)
                .Select(g => new ReportChartDataPoint { Label = g.Key, Value = g.Count() })
                .ToList();

            return new ReportSummaryDto
            {
                TotalCertificates = totalCerts,
                TotalSamples = totalSamples,
                EnvironmentalCertificates = envCerts,
                ConsumableCertificates = consCerts,
                EnvironmentalSamples = envSamples,
                ConsumableSamples = consSamples,
                Timeline = timeline,
                CertDistribution = certDistribution,
                TopSuppliers = topSuppliers,
                TopSenders = topSenders,
                TopOrigins = topOrigins,
                MonthlyPerformance = monthlyPerformance,
                SampleTypeComparison = sampleTypeComparison,
                TopAnalysisTypes = topAnalysisTypes
            };
        }

        /// <summary>
        /// استخراج بيانات الجدول المفصل مع Pagination
        /// </summary>
        public async Task<PagedResult<CertificateReportRow>> GetTableAsync(ReportRequest request)
        {
            var query = _context.Certificates
                .AsNoTracking()
                .Include(c => c.Samples)
                .Where(c => c.IssueDate >= request.StartDate && c.IssueDate <= request.EndDate);

            if (!string.IsNullOrWhiteSpace(request.Sender))
            {
                query = query.Where(c => c.Sender == request.Sender);
            }

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderByDescending(c => c.IssueDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(c => new CertificateReportRow
                {
                    CertificateNumber = c.CertificateNumber,
                    CertificateType = c.CertificateType,
                    AnalysisType = c.AnalysisType,
                    Sender = c.Sender,
                    Supplier = c.Supplier,
                    Origin = c.Origin,
                    NotificationNumber = c.NotificationNumber,
                    DeclarationNumber = c.DeclarationNumber,
                    FinancialReceiptNumber = c.FinancialReceiptNumber,
                    SampleCount = c.Samples.Count,
                    EnvSampleCount = c.CertificateType.Contains("بيئية") ? c.Samples.Count : 0,
                    ConsSampleCount = c.CertificateType.Contains("استهلاكية") ? c.Samples.Count : 0,
                    CreatedByName = c.CreatedByName,
                    IssueDate = c.IssueDate
                })
                .ToListAsync();

            return new PagedResult<CertificateReportRow>
            {
                Data = data,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// استخراج كل البيانات بدون pagination للتصدير (حد أقصى 1000 صف)
        /// </summary>
        public async Task<List<CertificateReportRow>> GetAllForExportAsync(ReportRequest request)
        {
            var query = _context.Certificates
                .AsNoTracking()
                .Include(c => c.Samples)
                .Where(c => c.IssueDate >= request.StartDate && c.IssueDate <= request.EndDate);

            if (!string.IsNullOrWhiteSpace(request.Sender))
            {
                query = query.Where(c => c.Sender == request.Sender);
            }

            return await query
                .OrderByDescending(c => c.IssueDate)
                .Take(1000) // حد أقصى لحماية الأداء
                .Select(c => new CertificateReportRow
                {
                    CertificateNumber = c.CertificateNumber,
                    CertificateType = c.CertificateType,
                    AnalysisType = c.AnalysisType,
                    Sender = c.Sender,
                    Supplier = c.Supplier,
                    Origin = c.Origin,
                    NotificationNumber = c.NotificationNumber,
                    DeclarationNumber = c.DeclarationNumber,
                    FinancialReceiptNumber = c.FinancialReceiptNumber,
                    SampleCount = c.Samples.Count,
                    EnvSampleCount = c.CertificateType.Contains("بيئية") ? c.Samples.Count : 0,
                    ConsSampleCount = c.CertificateType.Contains("استهلاكية") ? c.Samples.Count : 0,
                    CreatedByName = c.CreatedByName,
                    IssueDate = c.IssueDate
                })
                .ToListAsync();
        }

        /// <summary>
        /// قائمة الجهات المرسلة الفريدة
        /// </summary>
        public async Task<List<string>> GetSendersAsync()
        {
            return await _context.Certificates
                .AsNoTracking()
                .Where(c => !string.IsNullOrWhiteSpace(c.Sender))
                .Select(c => c.Sender!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();
        }

        /// <summary>
        /// تحويل رقم الشهر إلى اسم عربي
        /// </summary>
        private static string GetArabicMonth(int month)
        {
            return month switch
            {
                1 => "يناير",
                2 => "فبراير",
                3 => "مارس",
                4 => "أبريل",
                5 => "مايو",
                6 => "يونيو",
                7 => "يوليو",
                8 => "أغسطس",
                9 => "سبتمبر",
                10 => "أكتوبر",
                11 => "نوفمبر",
                12 => "ديسمبر",
                _ => month.ToString()
            };
        }
    }
}
