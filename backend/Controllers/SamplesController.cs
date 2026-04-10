using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SamplesController : ControllerBase
    {
        private readonly EnjazDbContext _context;

        public SamplesController(EnjazDbContext context)
        {
            _context = context;
        }

        // GET: api/Samples
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SampleReception>>> GetSampleReceptions()
        {
            return await _context.SampleReceptions
                .Include(r => r.Samples)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
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
            
            sampleReception.CreatedAt = DateTime.Now;
            
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
            existingReception.Date = sampleReception.Date;
            existingReception.UpdatedAt = DateTime.Now;

            // Update nested samples
            // Clear existing samples from database
            _context.ReceptionSamples.RemoveRange(existingReception.Samples);

            if (sampleReception.Samples != null)
            {
                foreach (var sample in sampleReception.Samples)
                {
                    sample.Id = 0; // Ensure new ID is generated
                    sample.SampleReceptionId = id; // Explicitly link
                    existingReception.Samples.Add(sample);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
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
            var sampleReception = await _context.SampleReceptions.FindAsync(id);
            if (sampleReception == null)
            {
                return NotFound();
            }

            _context.SampleReceptions.Remove(sampleReception);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
