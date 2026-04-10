using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers
{
    // Temporarily disabled authorization for testing. Uncomment when ready to enforce it.
    // [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CertificatesController : ControllerBase
    {
        private readonly EnjazDbContext _context;
        private readonly ICertificateService _certificateService;
        private readonly ILogger<CertificatesController> _logger;

        public CertificatesController(EnjazDbContext context, ICertificateService certificateService, ILogger<CertificatesController> logger)
        {
            _context = context;
            _certificateService = certificateService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCertificates([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Certificates
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
                var createdCert = await _certificateService.CreateCertificateAsync(certificate);
                var fullCert = await _context.Certificates
                    .Include(c => c.Samples)
                    .Include(c => c.SampleReception)
                    .FirstOrDefaultAsync(c => c.Id == createdCert.Id);
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
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCert == null)
            {
                return NotFound();
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
            existingCert.IssueDate = certificate.IssueDate;
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
                            existingSample.MeasurementDate = incomingSample.MeasurementDate;
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
