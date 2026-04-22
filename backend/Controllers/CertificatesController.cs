using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/certificates")]
    [ApiController]
    [Authorize]
    public class CertificatesController : ControllerBase
    {
        private readonly EnjazDbContext _context;
        private readonly ICertificateService _certificateService;
        private readonly ILogger<CertificatesController> _logger;
        private readonly IAuditLogService _audit;

        public CertificatesController(EnjazDbContext context, ICertificateService certificateService, ILogger<CertificatesController> logger, IAuditLogService audit)
        {
            _context = context;
            _certificateService = certificateService;
            _logger = logger;
            _audit = audit;
        }

        private (int? userId, string? userName) GetCurrentUser()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = User.FindFirst("fullName")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value;
            return (int.TryParse(idStr, out int id) ? id : null, name);
        }

        [HttpGet]
        public async Task<IActionResult> GetCertificates([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Certificates
                .AsNoTracking()
                .Include(c => c.Samples)
                .Include(c => c.SampleReception);

            var totalCount = await query.CountAsync();
            var certificates = await query
                .OrderByDescending(c => c.IssueDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { totalCount, items = certificates });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCertificateById(int id)
        {
            var certificate = await _context.Certificates
                .AsNoTracking()
                .Include(c => c.Samples)
                .Include(c => c.SampleReception)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (certificate == null)
            {
                return NotFound(new { message = $"Certificate with ID {id} not found" });
            }

            return Ok(certificate);
        }


        [HttpPost]
        public async Task<IActionResult> CreateCertificate([FromBody] Certificate certificate)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try 
            {
                certificate.IssueDate = DateTime.SpecifyKind(certificate.IssueDate, DateTimeKind.Utc);
                if (certificate.ExpiryDate.HasValue)
                {
                    certificate.ExpiryDate = DateTime.SpecifyKind(certificate.ExpiryDate.Value, DateTimeKind.Utc);
                }
                
                // Force CreatedAt to Utc in case it came from JSON
                certificate.CreatedAt = DateTime.UtcNow;
                var (userId, userName) = GetCurrentUser();
                certificate.CreatedBy = userId ?? 0;
                certificate.CreatedByName = userName;
                
                // Disconnect navigation property to prevent EF from tracking and attempting to update it with JSON-deserialized Local dates
                certificate.SampleReception = null;

                if (certificate.Samples != null)
                {
                    foreach (var s in certificate.Samples)
                    {
                        if (s.MeasurementDate.HasValue)
                        {
                            s.MeasurementDate = DateTime.SpecifyKind(s.MeasurementDate.Value, DateTimeKind.Utc);
                        }
                    }
                }

                var createdCert = await _certificateService.CreateCertificateAsync(certificate);
                var fullCert = await _context.Certificates
                    .Include(c => c.Samples)
                    .Include(c => c.SampleReception)
                    .FirstOrDefaultAsync(c => c.Id == createdCert.Id);

                // Audit Log
                await _audit.LogAsync(userId, userName, "إصدار شهادة جديدة",
                    $"تم إصدار شهادة رقم {createdCert.CertificateNumber}",
                    referenceId: createdCert.Id,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

                return CreatedAtAction(nameof(GetCertificates), new { id = createdCert.Id }, fullCert);
            }
            catch (Exception ex)
            {
                var fullError = ex.InnerException != null 
                    ? $"{ex.Message} --> {ex.InnerException.Message}" 
                    : ex.Message;
                _logger.LogError(ex, "Error creating certificate. Details: {FullError}", fullError);
                return StatusCode(500, new { message = "Error creating certificate", error = fullError });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCertificate(int id, [FromBody] Certificate certificate)
        {
            if (id != certificate.Id)
            {
                return BadRequest();
            }

            var existingCert = await _context.Certificates
                .Include(c => c.Samples)
                .Include(c => c.SampleReception)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCert == null)
            {
                return NotFound(new { message = "الشهادة غير موجودة" });
            }

            // Check for FinancialReceiptNumber uniqueness (excluding current certificate)
            if (!string.IsNullOrEmpty(certificate.FinancialReceiptNumber))
            {
                var exists = await _context.Certificates
                    .AnyAsync(c => c.FinancialReceiptNumber == certificate.FinancialReceiptNumber && c.Id != id);
                if (exists)
                {
                    return BadRequest(new { message = $"رقم الإيصال المالي ({certificate.FinancialReceiptNumber}) مستخدم بالفعل في شهادة أخرى." });
                }
            }

            // Disconnect navigation property to prevent EF tracking issues
            certificate.SampleReception = null;
            // ═══ Capture old values for change tracking ═══
            var changes = new List<string>();
            if (existingCert.CertificateType != certificate.CertificateType)
                changes.Add($"نوع الشهادة: \"{existingCert.CertificateType}\" ← \"{certificate.CertificateType}\"");
            if (existingCert.Sender != certificate.Sender)
                changes.Add($"الجهة المرسلة: \"{existingCert.Sender ?? "—"}\" ← \"{certificate.Sender ?? "—"}\"");
            if (existingCert.Supplier != certificate.Supplier)
                changes.Add($"المورد: \"{existingCert.Supplier ?? "—"}\" ← \"{certificate.Supplier ?? "—"}\"");
            if (existingCert.Origin != certificate.Origin)
                changes.Add($"المنشأ: \"{existingCert.Origin ?? "—"}\" ← \"{certificate.Origin ?? "—"}\"");
            if (existingCert.AnalysisType != certificate.AnalysisType)
                changes.Add($"نوع التحليل: \"{existingCert.AnalysisType ?? "—"}\" ← \"{certificate.AnalysisType ?? "—"}\"");
            if (existingCert.DeclarationNumber != certificate.DeclarationNumber)
                changes.Add($"رقم البيان: \"{existingCert.DeclarationNumber ?? "—"}\" ← \"{certificate.DeclarationNumber ?? "—"}\"");
            if (existingCert.NotificationNumber != certificate.NotificationNumber)
                changes.Add($"رقم الإخطار: \"{existingCert.NotificationNumber ?? "—"}\" ← \"{certificate.NotificationNumber ?? "—"}\"");
            if (existingCert.PolicyNumber != certificate.PolicyNumber)
                changes.Add($"رقم البوليصة: \"{existingCert.PolicyNumber ?? "—"}\" ← \"{certificate.PolicyNumber ?? "—"}\"");
            if (existingCert.FinancialReceiptNumber != certificate.FinancialReceiptNumber)
                changes.Add($"رقم الإيصال المالي: \"{existingCert.FinancialReceiptNumber ?? "—"}\" ← \"{certificate.FinancialReceiptNumber ?? "—"}\"");
            if (existingCert.IssueDate.Date != DateTime.SpecifyKind(certificate.IssueDate, DateTimeKind.Utc).Date)
                changes.Add($"تاريخ الإصدار: \"{existingCert.IssueDate:yyyy-MM-dd}\" ← \"{certificate.IssueDate:yyyy-MM-dd}\"");
            if (existingCert.SpecialistName != certificate.SpecialistName)
                changes.Add($"الأخصائي: \"{existingCert.SpecialistName ?? "—"}\" ← \"{certificate.SpecialistName ?? "—"}\"");
            if (existingCert.SectionHeadName != certificate.SectionHeadName)
                changes.Add($"رئيس القسم: \"{existingCert.SectionHeadName ?? "—"}\" ← \"{certificate.SectionHeadName ?? "—"}\"");
            if (existingCert.ManagerName != certificate.ManagerName)
                changes.Add($"المدير: \"{existingCert.ManagerName ?? "—"}\" ← \"{certificate.ManagerName ?? "—"}\"");
            if (existingCert.Notes != certificate.Notes)
                changes.Add($"الملاحظات: \"{existingCert.Notes ?? "—"}\" ← \"{certificate.Notes ?? "—"}\"");

            var certNumber = existingCert.CertificateNumber;

            // ═══ Track sample-level changes ═══
            var sampleChanges = new List<string>();
            if (certificate.Samples != null)
            {
                // Track removed samples
                var incomingSampleIds = certificate.Samples.Select(s => s.Id).ToList();
                var removedSamples = existingCert.Samples.Where(s => !incomingSampleIds.Contains(s.Id)).ToList();
                foreach (var removed in removedSamples)
                    sampleChanges.Add($"حذف عينة \"{removed.Description ?? removed.SampleNumber ?? "—"}\"");

                // Track added and modified samples
                foreach (var incoming in certificate.Samples)
                {
                    if (incoming.Id == 0)
                    {
                        sampleChanges.Add($"إضافة عينة جديدة \"{incoming.Description ?? incoming.SampleNumber ?? "—"}\"");
                    }
                    else
                    {
                        var existing = existingCert.Samples.FirstOrDefault(s => s.Id == incoming.Id);
                        if (existing != null)
                        {
                            var sampleFieldChanges = new List<string>();
                            if (existing.Description != incoming.Description)
                                sampleFieldChanges.Add($"الوصف: \"{existing.Description ?? "—"}\" ← \"{incoming.Description ?? "—"}\"");
                            if (existing.Result != incoming.Result)
                                sampleFieldChanges.Add($"النتيجة: \"{existing.Result ?? "—"}\" ← \"{incoming.Result ?? "—"}\"");
                            if (existing.SampleNumber != incoming.SampleNumber)
                                sampleFieldChanges.Add($"رقم العينة: \"{existing.SampleNumber ?? "—"}\" ← \"{incoming.SampleNumber ?? "—"}\"");
                            if (existing.IsotopeK40 != incoming.IsotopeK40)
                                sampleFieldChanges.Add($"K-40: \"{existing.IsotopeK40 ?? "—"}\" ← \"{incoming.IsotopeK40 ?? "—"}\"");
                            if (existing.IsotopeRa226 != incoming.IsotopeRa226)
                                sampleFieldChanges.Add($"Ra-226: \"{existing.IsotopeRa226 ?? "—"}\" ← \"{incoming.IsotopeRa226 ?? "—"}\"");
                            if (existing.IsotopeTh232 != incoming.IsotopeTh232)
                                sampleFieldChanges.Add($"Th-232: \"{existing.IsotopeTh232 ?? "—"}\" ← \"{incoming.IsotopeTh232 ?? "—"}\"");
                            if (existing.IsotopeRa != incoming.IsotopeRa)
                                sampleFieldChanges.Add($"Ra: \"{existing.IsotopeRa ?? "—"}\" ← \"{incoming.IsotopeRa ?? "—"}\"");
                            if (existing.IsotopeCs137 != incoming.IsotopeCs137)
                                sampleFieldChanges.Add($"Cs-137: \"{existing.IsotopeCs137 ?? "—"}\" ← \"{incoming.IsotopeCs137 ?? "—"}\"");
                            if (existing.Root != incoming.Root)
                                sampleFieldChanges.Add($"الجذر: \"{existing.Root}\" ← \"{incoming.Root}\"");

                            if (sampleFieldChanges.Count > 0)
                                sampleChanges.Add($"عينة \"{existing.Description ?? existing.SampleNumber ?? "—"}\": تعديل ({string.Join("، ", sampleFieldChanges)})");
                        }
                    }
                }
            }
            else if (existingCert.Samples.Any())
            {
                sampleChanges.Add($"حذف جميع العينات ({existingCert.Samples.Count} عينة)");
            }

            // Update fields
            existingCert.CertificateType = certificate.CertificateType;
            existingCert.Sender = certificate.Sender;
            existingCert.Supplier = certificate.Supplier;
            existingCert.Origin = certificate.Origin;
            existingCert.AnalysisType = certificate.AnalysisType;
            existingCert.DeclarationNumber = certificate.DeclarationNumber;
            existingCert.NotificationNumber = certificate.NotificationNumber;
            existingCert.PolicyNumber = certificate.PolicyNumber;
            existingCert.FinancialReceiptNumber = certificate.FinancialReceiptNumber;
            existingCert.IssueDate = DateTime.SpecifyKind(certificate.IssueDate, DateTimeKind.Utc);
            if (certificate.ExpiryDate.HasValue)
            {
                existingCert.ExpiryDate = DateTime.SpecifyKind(certificate.ExpiryDate.Value, DateTimeKind.Utc);
            }

            // Sync key fields back to sample reception if it exists
            if (existingCert.SampleReception != null)
            {
                if (!string.IsNullOrEmpty(certificate.FinancialReceiptNumber))
                    existingCert.SampleReception.FinancialReceiptNumber = certificate.FinancialReceiptNumber;
                if (!string.IsNullOrEmpty(certificate.PolicyNumber))
                    existingCert.SampleReception.PolicyNumber = certificate.PolicyNumber;
                if (!string.IsNullOrEmpty(certificate.DeclarationNumber))
                    existingCert.SampleReception.DeclarationNumber = certificate.DeclarationNumber;
                if (!string.IsNullOrEmpty(certificate.NotificationNumber))
                    existingCert.SampleReception.NotificationNumber = certificate.NotificationNumber;
                
                existingCert.SampleReception.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existingCert.ExpiryDate = null;
            }
            existingCert.SpecialistName = certificate.SpecialistName;
            existingCert.SectionHeadName = certificate.SectionHeadName;
            existingCert.ManagerName = certificate.ManagerName;
            existingCert.Notes = certificate.Notes;

            // Update nested samples securely (Data Integrity)
            if (certificate.Samples != null)
            {
                var incomingSampleIds = certificate.Samples.Select(s => s.Id).ToList();
                var samplesToRemove = existingCert.Samples.Where(s => !incomingSampleIds.Contains(s.Id)).ToList();
                _context.Samples.RemoveRange(samplesToRemove);

                foreach (var incomingSample in certificate.Samples)
                {
                    if (incomingSample.Id == 0)
                    {
                        // Add new sample
                        if (incomingSample.MeasurementDate.HasValue)
                        {
                            incomingSample.MeasurementDate = DateTime.SpecifyKind(incomingSample.MeasurementDate.Value, DateTimeKind.Utc);
                        }
                        incomingSample.CertificateId = existingCert.Id;
                        existingCert.Samples.Add(incomingSample);
                    }
                    else
                    {
                        // Update existing sample
                        var existingSample = existingCert.Samples.FirstOrDefault(s => s.Id == incomingSample.Id);
                        if (existingSample != null)
                        {
                            existingSample.Root = incomingSample.Root;
                            existingSample.SampleNumber = incomingSample.SampleNumber;
                            existingSample.Description = incomingSample.Description;
                            
                            if (incomingSample.MeasurementDate.HasValue)
                            {
                                existingSample.MeasurementDate = DateTime.SpecifyKind(incomingSample.MeasurementDate.Value, DateTimeKind.Utc);
                            }
                            else
                            {
                                existingSample.MeasurementDate = null;
                            }
                            
                            existingSample.Result = incomingSample.Result;
                            existingSample.IsotopeK40 = incomingSample.IsotopeK40;
                            existingSample.IsotopeRa226 = incomingSample.IsotopeRa226;
                            existingSample.IsotopeTh232 = incomingSample.IsotopeTh232;
                            existingSample.IsotopeRa = incomingSample.IsotopeRa;
                            existingSample.IsotopeCs137 = incomingSample.IsotopeCs137;
                        }
                    }
                }
            }
            else
            {
                _context.Samples.RemoveRange(existingCert.Samples);
            }

            try
            {
                await _context.SaveChangesAsync();

                // Audit Log — Build comprehensive details
                var (userId, userName) = GetCurrentUser();
                var allChanges = new List<string>();
                if (changes.Count > 0)
                    allChanges.AddRange(changes);
                if (sampleChanges.Count > 0)
                    allChanges.AddRange(sampleChanges);

                string details;
                if (allChanges.Count > 0)
                    details = $"شهادة رقم {certNumber} — تم تعديل: {string.Join(" | ", allChanges)}";
                else
                    details = $"شهادة رقم {certNumber} — تم حفظ البيانات بدون تغييرات";

                // Truncate to fit DB field (2000 chars)
                if (details.Length > 2000)
                    details = details[..1997] + "...";

                await _audit.LogAsync(userId, userName, "تعديل شهادة",
                    details,
                    referenceId: id,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

                return Ok(existingCert);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating certificate {CertificateId}", id);
                return StatusCode(500, new { message = "Error updating certificate", error = ex.Message });
            }
        }

        [HttpPost("{id}/pdf")]
        public IActionResult GeneratePdf(int id)
        {
            // PDF Generation is planned for Phase 2
            return Ok(new { message = $"PDF generation for certificate {id} is coming in Phase 2" });
        }
    }
}
