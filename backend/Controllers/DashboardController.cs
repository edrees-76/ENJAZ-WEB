using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Asp.Versioning;
using Microsoft.Extensions.Logging;

using backend.Services;

namespace backend.Controllers
{
    [Authorize]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
        {
            _dashboardService = dashboardService;
            _logger = logger;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string period = "year", [FromQuery] string timezone = "UTC", [FromQuery] int? year = null)
        {
            try 
            {
                var result = await _dashboardService.GetStatsAsync(period, timezone, year);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading dashboard statistics");
                return StatusCode(500, new { message = "حدث خطأ أثناء تحميل الإحصائيات. يرجى المحاولة لاحقاً." });
            }
        }
    }
}
