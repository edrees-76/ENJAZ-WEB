using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/system-management")]
    [ApiController]
    public class SystemManagementController : ControllerBase
    {
        private readonly EnjazDbContext _context;

        public SystemManagementController(EnjazDbContext context)
        {
            _context = context;
        }

        [HttpPost("clear-all-logs")]
        public async Task<IActionResult> ClearAllLogs()
        {
            try
            {
                if (_context.Database.IsNpgsql())
                {
                    await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Samples\", \"Certificates\", \"ReceptionSamples\", \"SampleReceptions\" RESTART IDENTITY CASCADE;");
                }
                else
                {
                    // Delete in order to satisfy foreign key constraints if they aren't cascading
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Samples;");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Certificates;");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM ReceptionSamples;");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM SampleReceptions;");
                    
                    // Reset sequences for SQLite to start IDs from 1
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name IN ('Certificates', 'SampleReceptions', 'Samples', 'ReceptionSamples');");
                }
                
                return Ok(new { message = "تم مسح كافة السجلات بنجاح وإعادة ضبط العدادات." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء مسح السجلات", error = ex.Message });
            }
        }
    }
}
