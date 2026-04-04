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
            // Ensure tables are created (useful for dev/first run)
            _context.Database.EnsureCreated();
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
            // Calculate next sequence (Simplified for now)
            var lastEntry = await _context.SampleReceptions.OrderByDescending(r => r.Id).FirstOrDefaultAsync();
            sampleReception.Sequence = (lastEntry?.Sequence ?? 0) + 1;
            
            sampleReception.CreatedAt = DateTime.UtcNow;
            
            _context.SampleReceptions.Add(sampleReception);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSampleReception", new { id = sampleReception.Id }, sampleReception);
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
