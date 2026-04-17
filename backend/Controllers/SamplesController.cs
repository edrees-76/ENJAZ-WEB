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
    [Route("api/v{version:apiVersion}/samples")]
    [ApiController]
    [Authorize]
    public class SamplesController : ControllerBase
    {
        private readonly EnjazDbContext _context;
        private readonly IAuditLogService _audit;

        public SamplesController(EnjazDbContext context, IAuditLogService audit)
        {
            _context = context;
            _audit = audit;
        }

        private (int? userId, string? userName) GetCurrentUser()
        {
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = User.FindFirst("fullName")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value;
            return (int.TryParse(idStr, out int id) ? id : null, name);
        }

        // GET: api/Samples
        [HttpGet]
        public async Task<IActionResult> GetSampleReceptions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromServices] IConfiguration config = null!)
        {
            var query = _context.SampleReceptions
                .Include(r => r.Samples)
                .OrderByDescending(r => r.CreatedAt);

            var enablePagination = config?.GetValue<bool>("Features:EnablePagination") ?? false;

            if (enablePagination)
            {
                var totalCount = await query.CountAsync();
                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    items
                });
            }
            else
            {
                // شكل التوافقية القديم (بدون تصفح)
                var items = await query.ToListAsync();
                return Ok(items);
            }
        }

        // GET: api/Samples/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SampleReception>> GetSampleReception(int id)
        {
            var sampleReception = await _context.SampleReceptions
                .Include(r => r.Samples)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (sampleReception == null)
            {
                return NotFound();
            }

            return sampleReception;
        }

        // POST: api/Samples
        [HttpPost]
        public async Task<ActionResult<SampleReception>> PostSampleReception(SampleReception sampleReception)
        {
            // Calculate next sequence
            var lastEntry = await _context.SampleReceptions.OrderByDescending(r => r.Id).FirstOrDefaultAsync();
            sampleReception.Sequence = (lastEntry?.Sequence ?? 0) + 1;
            
            sampleReception.Date = DateTime.SpecifyKind(sampleReception.Date, DateTimeKind.Utc);
            sampleReception.CreatedAt = DateTime.UtcNow;
            
            var (userId, userName) = GetCurrentUser();
            sampleReception.CreatedBy = userId ?? 0;
            sampleReception.CreatedByName = userName;
            
            // Ensure samples have proper reference
            if (sampleReception.Samples != null)
            {
                foreach (var sample in sampleReception.Samples)
                {
                    sample.Id = 0; // Reset ID for new entries
                    sample.SampleReception = null; // Prevent circular reference
                }
            }
            
            _context.SampleReceptions.Add(sampleReception);
            await _context.SaveChangesAsync();

            // Audit Log
            await _audit.LogAsync(userId, userName, "استلام عينات جديدة",
                $"تم استلام عينات جديدة — رقم الإخطار: {sampleReception.NotificationNumber ?? "—"} — رقم طلب التحليل: {sampleReception.AnalysisRequestNumber}",
                referenceId: sampleReception.Id,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

            return CreatedAtAction("GetSampleReception", new { id = sampleReception.Id }, sampleReception);
        }

        // PUT: api/Samples/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSampleReception(int id, SampleReception sampleReception)
        {
            if (id != sampleReception.Id)
            {
                return BadRequest();
            }

            var existingReception = await _context.SampleReceptions
                .Include(r => r.Samples)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existingReception == null)
            {
                return NotFound();
            }

            // ═══ Capture old values for change tracking ═══
            var changes = new List<string>();
            if (existingReception.AnalysisRequestNumber != sampleReception.AnalysisRequestNumber)
                changes.Add($"رقم طلب التحليل: \"{existingReception.AnalysisRequestNumber}\" ← \"{sampleReception.AnalysisRequestNumber}\"");
            if (existingReception.NotificationNumber != sampleReception.NotificationNumber)
                changes.Add($"رقم الإخطار: \"{existingReception.NotificationNumber ?? "—"}\" ← \"{sampleReception.NotificationNumber ?? "—"}\"");
            if (existingReception.DeclarationNumber != sampleReception.DeclarationNumber)
                changes.Add($"رقم البيان: \"{existingReception.DeclarationNumber ?? "—"}\" ← \"{sampleReception.DeclarationNumber ?? "—"}\"");
            if (existingReception.Supplier != sampleReception.Supplier)
                changes.Add($"المورد: \"{existingReception.Supplier ?? "—"}\" ← \"{sampleReception.Supplier ?? "—"}\"");
            if (existingReception.Sender != sampleReception.Sender)
                changes.Add($"الجهة المرسلة: \"{existingReception.Sender}\" ← \"{sampleReception.Sender}\"");
            if (existingReception.Origin != sampleReception.Origin)
                changes.Add($"المنشأ: \"{existingReception.Origin ?? "—"}\" ← \"{sampleReception.Origin ?? "—"}\"");
            if (existingReception.PolicyNumber != sampleReception.PolicyNumber)
                changes.Add($"رقم البوليصة: \"{existingReception.PolicyNumber ?? "—"}\" ← \"{sampleReception.PolicyNumber ?? "—"}\"");
            if (existingReception.FinancialReceiptNumber != sampleReception.FinancialReceiptNumber)
                changes.Add($"رقم الإيصال المالي: \"{existingReception.FinancialReceiptNumber ?? "—"}\" ← \"{sampleReception.FinancialReceiptNumber ?? "—"}\"");
            if (existingReception.CertificateType != sampleReception.CertificateType)
                changes.Add($"نوع الشهادة: \"{existingReception.CertificateType}\" ← \"{sampleReception.CertificateType}\"");
            if (existingReception.Date.Date != DateTime.SpecifyKind(sampleReception.Date, DateTimeKind.Utc).Date)
                changes.Add($"تاريخ الاستلام: \"{existingReception.Date:yyyy-MM-dd}\" ← \"{sampleReception.Date:yyyy-MM-dd}\"");

            var oldNotification = existingReception.NotificationNumber ?? "—";
            var oldAnalysis = existingReception.AnalysisRequestNumber;

            // Update basic properties
            existingReception.AnalysisRequestNumber = sampleReception.AnalysisRequestNumber;
            existingReception.NotificationNumber = sampleReception.NotificationNumber;
            existingReception.DeclarationNumber = sampleReception.DeclarationNumber;
            existingReception.Supplier = sampleReception.Supplier;
            existingReception.Sender = sampleReception.Sender;
            existingReception.Origin = sampleReception.Origin;
            existingReception.PolicyNumber = sampleReception.PolicyNumber;
            existingReception.FinancialReceiptNumber = sampleReception.FinancialReceiptNumber;
            existingReception.CertificateType = sampleReception.CertificateType;
            existingReception.Date = DateTime.SpecifyKind(sampleReception.Date, DateTimeKind.Utc);
            existingReception.UpdatedAt = DateTime.UtcNow;
            
            var (userId, userName) = GetCurrentUser();
            existingReception.UpdatedBy = userId;
            existingReception.UpdatedByName = userName;

            // Update nested samples and track changes
            var sampleChanges = new List<string>();
            if (sampleReception.Samples != null)
            {
                var incomingSampleIds = sampleReception.Samples.Select(s => s.Id).ToList();
                var removedSamples = existingReception.Samples.Where(s => !incomingSampleIds.Contains(s.Id)).ToList();
                
                foreach (var removed in removedSamples)
                {
                    sampleChanges.Add($"حذف عينة \"{removed.Description ?? removed.SampleNumber ?? "—"}\"");
                    _context.ReceptionSamples.Remove(removed);
                }

                foreach (var incoming in sampleReception.Samples)
                {
                    if (incoming.Id == 0) // New sample
                    {
                        sampleChanges.Add($"إضافة عينة جديدة \"{incoming.Description ?? incoming.SampleNumber ?? "—"}\"");
                        incoming.SampleReceptionId = id;
                        existingReception.Samples.Add(incoming);
                    }
                    else // Existing sample
                    {
                        var existing = existingReception.Samples.FirstOrDefault(s => s.Id == incoming.Id);
                        if (existing != null)
                        {
                            var sampleFieldChanges = new List<string>();
                            if (existing.Description != incoming.Description)
                                sampleFieldChanges.Add($"الوصف: \"{existing.Description ?? "—"}\" ← \"{incoming.Description ?? "—"}\"");
                            if (existing.SampleNumber != incoming.SampleNumber)
                                sampleFieldChanges.Add($"رقم العينة: \"{existing.SampleNumber ?? "—"}\" ← \"{incoming.SampleNumber ?? "—"}\"");
                            if (existing.Root != incoming.Root)
                                sampleFieldChanges.Add($"الجذر: \"{existing.Root}\" ← \"{incoming.Root}\"");

                            if (sampleFieldChanges.Count > 0)
                                sampleChanges.Add($"عينة \"{existing.Description ?? existing.SampleNumber ?? "—"}\": تعديل ({string.Join("، ", sampleFieldChanges)})");

                            // Update properties
                            existing.Description = incoming.Description;
                            existing.SampleNumber = incoming.SampleNumber;
                            existing.Root = incoming.Root;
                        }
                    }
                }
            }
            else
            {
                foreach(var s in existingReception.Samples.ToList())
                {
                    sampleChanges.Add($"حذف عينة \"{s.Description ?? s.SampleNumber ?? "—"}\"");
                    _context.ReceptionSamples.Remove(s);
                }
            }

            if (sampleChanges.Count > 0)
            {
                changes.Add(string.Join(" | ", sampleChanges));
            }

            try
            {
                await _context.SaveChangesAsync();

                // Audit Log
                var changeDetails = changes.Count > 0 
                    ? "تم تعديل: " + string.Join(" | ", changes)
                    : "تم تعديل بيانات العينات الفرعية";
                var details = $"{changeDetails} — رقم الإخطار: {oldNotification} — رقم طلب التحليل: {oldAnalysis}";
                await _audit.LogAsync(userId, userName, "تعديل بيانات عينة",
                    details,
                    referenceId: id,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SampleReceptionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(existingReception);
        }

        private bool SampleReceptionExists(int id)
        {
            return _context.SampleReceptions.Any(e => e.Id == id);
        }

        // DELETE: api/Samples/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSampleReception(int id)
        {
            var sampleReception = await _context.SampleReceptions
                .Include(r => r.Samples)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (sampleReception == null)
            {
                return NotFound();
            }

            // Audit Log before deletion
            var (userId, userName) = GetCurrentUser();
            await _audit.LogAsync(userId, userName, "حذف عينة",
                $"تم حذف العينة رقم {sampleReception.Sequence} — المورد: {sampleReception.Supplier ?? "غير محدد"} — عدد العينات: {sampleReception.Samples.Count}",
                referenceId: id,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

            _context.SampleReceptions.Remove(sampleReception);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
