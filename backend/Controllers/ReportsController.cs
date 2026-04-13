using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using System.Diagnostics;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/reports")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ReportService _reportService;
        private readonly ExcelExportService _excelService;
        private readonly PdfExportService _pdfService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(
            ReportService reportService,
            ExcelExportService excelService,
            PdfExportService pdfService,
            ILogger<ReportsController> logger)
        {
            _reportService = reportService;
            _excelService = excelService;
            _pdfService = pdfService;
            _logger = logger;
        }

        /// <summary>
        /// استخراج الملخص الإحصائي والمخططات البيانية
        /// </summary>
        [HttpPost("summary")]
        public async Task<IActionResult> GetSummary([FromBody] ReportRequest request)
        {
            try
            {
                // Normalize dates to UTC for PostgreSQL timestamptz
                request.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
                request.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);

                // Validation: EndDate بعد StartDate
                if (request.EndDate.Date < request.StartDate.Date)
                {
                    return BadRequest(new { message = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
                }

                // توسيع تاريخ النهاية ليشمل نهاية اليوم
                request.EndDate = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                // Validation: الفترة لا تتجاوز سنتين
                if ((request.EndDate - request.StartDate).TotalDays > 730)
                {
                    return BadRequest(new { message = "الفترة الزمنية لا يمكن أن تتجاوز سنتين" });
                }

                var summary = await _reportService.GetSummaryAsync(request);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report summary");
                return StatusCode(500, new { message = "حدث خطأ أثناء توليد ملخص التقرير" });
            }
        }

        /// <summary>
        /// استخراج الجدول التفصيلي مع Pagination
        /// </summary>
        [HttpPost("table")]
        public async Task<IActionResult> GetTable([FromBody] ReportRequest request)
        {
            try
            {
                // Normalize dates to UTC for PostgreSQL timestamptz
                request.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
                request.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);

                if (request.EndDate.Date < request.StartDate.Date)
                {
                    return BadRequest(new { message = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
                }

                // توسيع تاريخ النهاية ليشمل نهاية اليوم
                request.EndDate = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                // حدود الترقيم
                if (request.PageSize > 100) request.PageSize = 100;
                if (request.Page < 1) request.Page = 1;

                var result = await _reportService.GetTableAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report table");
                return StatusCode(500, new { message = "حدث خطأ أثناء تحميل بيانات الجدول" });
            }
        }

        /// <summary>
        /// قائمة الجهات المرسلة الفريدة (للـ ComboBox)
        /// </summary>
        [HttpGet("senders")]
        public async Task<IActionResult> GetSenders()
        {
            try
            {
                var senders = await _reportService.GetSendersAsync();
                return Ok(senders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching senders list");
                return StatusCode(500, new { message = "حدث خطأ أثناء تحميل قائمة الجهات" });
            }
        }

        /// <summary>
        /// تصدير التقرير كملف Excel
        /// </summary>
        [HttpPost("export/excel")]
        public async Task<IActionResult> ExportExcel([FromBody] ReportRequest request)
        {
            try
            {
                // Normalize dates to UTC for PostgreSQL timestamptz
                request.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
                request.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);

                if (request.EndDate.Date < request.StartDate.Date)
                {
                    return BadRequest(new { message = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
                }

                // توسيع تاريخ النهاية ليشمل نهاية اليوم
                request.EndDate = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var data = await _reportService.GetAllForExportAsync(request);
                var summary = await _reportService.GetSummaryAsync(request);
                var fileBytes = _excelService.GenerateExcel(data, summary, request);

                var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm");
                var fileName = request.ReportType == "sender"
                    ? $"{request.SenderName}_{timestamp}.xlsx"
                    : $"التقرير_العام_{timestamp}.xlsx";

                return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting Excel report");
                return StatusCode(500, new { message = "حدث خطأ أثناء تصدير ملف Excel" });
            }
        }

        /// <summary>
        /// تصدير التقرير كملف PDF
        /// </summary>
        [HttpPost("export/pdf")]
        public async Task<IActionResult> ExportPdf([FromBody] ReportRequest request)
        {
            try
            {
                // Normalize dates to UTC for PostgreSQL timestamptz
                request.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
                request.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);

                if (request.EndDate.Date < request.StartDate.Date)
                {
                    return BadRequest(new { message = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
                }

                // توسيع تاريخ النهاية ليشمل نهاية اليوم
                request.EndDate = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var data = await _reportService.GetAllForExportAsync(request);
                var summary = await _reportService.GetSummaryAsync(request);
                var fileBytes = _pdfService.GeneratePdf(data, summary, request);

                var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm");
                var fileName = request.ReportType == "sender"
                    ? $"{request.SenderName}_{timestamp}.pdf"
                    : $"التقرير_العام_{timestamp}.pdf";

                return File(fileBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting PDF report");
                return StatusCode(500, new { message = "حدث خطأ أثناء تصدير ملف PDF" });
            }
        }
    }
}
