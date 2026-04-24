using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    /// <summary>
    /// Administrative Procedures — Referral Letter Management.
    /// Handles creation, preview, PDF generation, and history of referral letters.
    /// </summary>
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/admin-procedures")]
    [ApiController]
    [Authorize]
    public class AdminProceduresController : ControllerBase
    {
        private readonly EnjazDbContext _context;
        private readonly ReferralPdfService _pdfService;
        private readonly ILogger<AdminProceduresController> _logger;
        private readonly IAuditLogService _audit;
        private readonly string _pdfStoragePath;

        public AdminProceduresController(
            EnjazDbContext context,
            ReferralPdfService pdfService,
            ILogger<AdminProceduresController> logger,
            IAuditLogService audit)
        {
            _context = context;
            _pdfService = pdfService;
            _logger = logger;
            _audit = audit;

            // Store generated PDFs in a dedicated directory
            _pdfStoragePath = Path.Combine(
                Directory.GetCurrentDirectory(), "GeneratedPdfs", "Referrals");
            Directory.CreateDirectory(_pdfStoragePath);
        }

        private (int? userId, string? userName) GetCurrentUser()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = User.FindFirst("fullName")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value;
            return (int.TryParse(idStr, out int id) ? id : null, name);
        }

        // ═══════════════════════════════════════════════════
        // GET /api/admin-procedures/senders
        // Returns distinct sender names for the filter dropdown.
        // ═══════════════════════════════════════════════════
        [HttpGet("senders")]
        [ResponseCache(Duration = 300)] // Cache for 5 minutes
        public async Task<IActionResult> GetSenders()
        {
            var senders = await _context.Certificates
                .Where(c => !string.IsNullOrEmpty(c.Sender))
                .Select(c => c.Sender!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            return Ok(senders);
        }

        // ═══════════════════════════════════════════════════
        // POST /api/admin-procedures/preview
        // Returns matching certificate count for wizard Step 3.
        // Uses Projection (DTO) — no lazy loading.
        // ═══════════════════════════════════════════════════
        [HttpPost("preview")]
        public async Task<IActionResult> PreviewCertificates([FromBody] PreviewRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SenderName))
                return BadRequest(new { message = "يجب تحديد الجهة المرسلة" });

            var start = DateTime.SpecifyKind(request.StartDate.Date, DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

            var query = _context.Certificates
                .Include(c => c.Samples)
                .Where(c => c.Sender == request.SenderName
                    && c.IssueDate >= start
                    && c.IssueDate <= end);

            var totalCount = await query.CountAsync();
            var totalSamples = await query.SelectMany(c => c.Samples).CountAsync();

            // Return projected preview for the confirmation step
            var previewItems = await query
                .OrderByDescending(c => c.IssueDate)
                .Take(50) // Limit preview to 50 for performance
                .Select(c => new
                {
                    c.Id,
                    c.CertificateNumber,
                    c.Supplier,
                    c.NotificationNumber,
                    SampleCount = c.Samples.Count,
                    SampleNumbers = string.Join(", ", c.Samples.Select(s => s.SampleNumber))
                })
                .ToListAsync();

            return Ok(new
            {
                totalCertificates = totalCount,
                totalSamples,
                previewItems
            });
        }

        // ═══════════════════════════════════════════════════
        // POST /api/admin-procedures/generate
        // Creates record + links certificates + generates PDF.
        // ═══════════════════════════════════════════════════
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateReferralLetter([FromBody] GenerateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SenderName))
                return BadRequest(new { message = "يجب تحديد الجهة المرسلة" });

            // Npgsql retry strategy requires wrapping user transactions inside ExecuteAsync
            var strategy = _context.Database.CreateExecutionStrategy();

            byte[]? pdfBytes = null;
            string? referenceNumber = null;
            int certCount = 0;
            string? createdByName = null;
            int? letterId = null;

            try
            {
                await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();

                    var start = DateTime.SpecifyKind(request.StartDate.Date, DateTimeKind.Utc);
                    var end = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                    // 1. Query matching certificates with projection
                    var certificates = await _context.Certificates
                        .Include(c => c.Samples)
                        .Where(c => c.Sender == request.SenderName
                            && c.IssueDate >= start
                            && c.IssueDate <= end)
                        .OrderBy(c => c.IssueDate)
                        .ToListAsync();

                    if (certificates.Count == 0)
                        throw new InvalidOperationException("NO_MATCHING_CERTIFICATES");

                    var totalSamples = certificates.Sum(c => c.Samples.Count);

                    // 2. Generate reference number (REF-YYYY-NNNNNN)
                    var year = DateTime.UtcNow.Year;
                    var lastRef = await _context.ReferralLetters
                        .IgnoreQueryFilters() // Include soft-deleted for numbering
                        .Where(r => r.ReferenceNumber.StartsWith($"REF-{year}-"))
                        .OrderByDescending(r => r.Id)
                        .FirstOrDefaultAsync();

                    int nextSeq = 1;
                    if (lastRef != null)
                    {
                        var parts = lastRef.ReferenceNumber.Split('-');
                        if (parts.Length == 3 && int.TryParse(parts[2], out int lastSeq))
                            nextSeq = lastSeq + 1;
                    }

                    referenceNumber = $"REF-{year}-{nextSeq:D6}";

                    // 3. Create the ReferralLetter record
                    var letter = new ReferralLetter
                    {
                        ReferenceNumber = referenceNumber,
                        GeneratedAt = DateTime.UtcNow,
                        SenderName = request.SenderName,
                        CertificateCount = certificates.Count,
                        SampleCount = totalSamples,
                        StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
                        EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
                        IncludedColumns = (ReferralColumns)request.IncludedColumns,
                        TemplateVersion = _pdfService.CurrentTemplateVersion,
                        CreatedByName = request.CreatedByName ?? "مسؤول النظام"
                    };

                    _context.ReferralLetters.Add(letter);
                    await _context.SaveChangesAsync();

                    // 4. Create Snapshot — link certificates to the letter
                    var linkedCerts = certificates.Select(c => new ReferralLetterCertificate
                    {
                        ReferralLetterId = letter.Id,
                        CertificateId = c.Id
                    }).ToList();

                    _context.ReferralLetterCertificates.AddRange(linkedCerts);
                    await _context.SaveChangesAsync();

                    // 5. Generate PDF from snapshot data
                    var certDtos = certificates.Select(c => new ReferralCertificateDto
                    {
                        Id = c.Id,
                        CertificateNumber = c.CertificateNumber,
                        Supplier = c.Supplier,
                        NotificationNumber = c.NotificationNumber,
                        SampleCount = c.Samples.Count,
                        SampleNumbers = string.Join(", ", c.Samples.Select(s => s.SampleNumber))
                    }).ToList();

                    pdfBytes = _pdfService.GenerateReferralPdf(letter, certDtos);

                    // 6. Save PDF to disk
                    var fileName = $"{referenceNumber}.pdf";
                    var filePath = Path.Combine(_pdfStoragePath, fileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);

                    letter.PdfPath = filePath;
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    certCount = certificates.Count;
                    createdByName = letter.CreatedByName;
                    letterId = letter.Id;
                });

                // 8. Audit log (outside transaction)
                var (auditUserId, auditUserName) = GetCurrentUser();
                await _audit.LogAsync(auditUserId, auditUserName, "إصدار رسالة إحالة",
                    $"تم إصدار إحالة لـ {request.SenderName} — عدد الشهادات: {certCount}",
                    referenceId: letterId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

                _logger.LogInformation(
                    "Referral letter generated: {RefNumber} | Sender: {Sender} | Certificates: {Count} | By: {User}",
                    referenceNumber, request.SenderName, certCount, createdByName);

                // 9. Return the PDF file
                return File(pdfBytes!, "application/pdf", $"{referenceNumber}.pdf");
            }
            catch (InvalidOperationException ex) when (ex.Message == "NO_MATCHING_CERTIFICATES")
            {
                return BadRequest(new { message = "لا توجد شهادات مطابقة للمعايير المحددة" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating referral letter for {Sender}", request.SenderName);
                return StatusCode(500, new { message = "حدث خطأ أثناء إنشاء رسالة الإحالة", error = ex.ToString() });
            }
        }

        // ═══════════════════════════════════════════════════
        // GET /api/admin-procedures/history
        // Returns paginated referral letter history with optional sender filter.
        // ═══════════════════════════════════════════════════
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sender = null)
        {
            var query = _context.ReferralLetters.AsQueryable();

            if (!string.IsNullOrWhiteSpace(sender))
                query = query.Where(r => r.SenderName == sender);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.GeneratedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.ReferenceNumber,
                    r.GeneratedAt,
                    r.SenderName,
                    r.CertificateCount,
                    r.SampleCount,
                    r.StartDate,
                    r.EndDate
                })
                .ToListAsync();

            return Ok(new { totalCount, items });
        }

        // ═══════════════════════════════════════════════════
        // GET /api/admin-procedures/{id}/pdf
        // Downloads the PDF. Regenerates from snapshot if file is missing.
        // ═══════════════════════════════════════════════════
        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            var letter = await _context.ReferralLetters
                .FirstOrDefaultAsync(r => r.Id == id);

            if (letter == null)
                return NotFound(new { message = "رسالة الإحالة غير موجودة" });

            // Try to serve existing file first
            if (!string.IsNullOrEmpty(letter.PdfPath) && System.IO.File.Exists(letter.PdfPath))
            {
                var existingPdf = await System.IO.File.ReadAllBytesAsync(letter.PdfPath);
                return File(existingPdf, "application/pdf", $"{letter.ReferenceNumber}.pdf");
            }

            // Regenerate from snapshot if file is missing
            _logger.LogWarning("PDF file missing for {RefNumber}, regenerating from snapshot", letter.ReferenceNumber);

            var certDtos = await _context.ReferralLetterCertificates
                .Where(lc => lc.ReferralLetterId == id)
                .Include(lc => lc.Certificate)
                    .ThenInclude(c => c.Samples)
                .Select(lc => new ReferralCertificateDto
                {
                    Id = lc.Certificate.Id,
                    CertificateNumber = lc.Certificate.CertificateNumber,
                    Supplier = lc.Certificate.Supplier,
                    NotificationNumber = lc.Certificate.NotificationNumber,
                    SampleCount = lc.Certificate.Samples.Count,
                    SampleNumbers = string.Join(", ", lc.Certificate.Samples.Select(s => s.SampleNumber))
                })
                .ToListAsync();

            var pdfBytes = _pdfService.GenerateReferralPdf(letter, certDtos);

            // Save regenerated file
            var fileName = $"{letter.ReferenceNumber}.pdf";
            var filePath = Path.Combine(_pdfStoragePath, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
            letter.PdfPath = filePath;
            await _context.SaveChangesAsync();

            return File(pdfBytes, "application/pdf", $"{letter.ReferenceNumber}.pdf");
        }

        // ═══════════════════════════════════════════════════
        // DELETE /api/admin-procedures/{id}
        // Soft delete — sets IsDeleted flag, preserves data for audit.
        // ═══════════════════════════════════════════════════
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteLetter(int id)
        {
            var letter = await _context.ReferralLetters.FindAsync(id);
            if (letter == null)
                return NotFound(new { message = "رسالة الإحالة غير موجودة" });

            letter.IsDeleted = true;
            await _context.SaveChangesAsync();

            // Audit Log
            var (userId, userName) = GetCurrentUser();
            await _audit.LogAsync(userId, userName, "حذف رسالة إحالة",
                $"تم حذف رسالة الإحالة {letter.ReferenceNumber} — الجهة: {letter.SenderName} — عدد الشهادات: {letter.CertificateCount}",
                referenceId: id,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

            _logger.LogInformation(
                "Referral letter soft-deleted: {RefNumber} | By system action",
                letter.ReferenceNumber);

            return Ok(new { message = "تم حذف الرسالة بنجاح" });
        }
    }

    // ═══════════════════════════════════════════════
    // Request DTOs
    // ═══════════════════════════════════════════════

    public class PreviewRequest
    {
        public string SenderName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class GenerateRequest
    {
        public string SenderName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int IncludedColumns { get; set; } = 15; // Default: All flags (1|2|4|8)
        public string? CreatedByName { get; set; }
    }
}
