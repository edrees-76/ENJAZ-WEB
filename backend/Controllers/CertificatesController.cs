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

        public CertificatesController(EnjazDbContext context, ICertificateService certificateService)
        {
            _context = context;
            _certificateService = certificateService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCertificates()
        {
            var certificates = await _context.Certificates
                .Include(c => c.Samples)
                .Include(c => c.SampleReception)
                .OrderByDescending(c => c.IssueDate)
                .ToListAsync();

            return Ok(certificates);
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
                Console.WriteLine($"[CERTIFICATE ERROR] {fullError}");
                Console.WriteLine($"[CERTIFICATE STACK] {ex.StackTrace}");
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

            // Update nested samples
            _context.Samples.RemoveRange(existingCert.Samples);

            if (certificate.Samples != null)
            {
                foreach (var sample in certificate.Samples)
                {
                    sample.Id = 0; // generate fresh IDs
                    sample.CertificateId = id;
                    existingCert.Samples.Add(sample);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(existingCert);
            }
            catch (Exception ex)
            {
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
