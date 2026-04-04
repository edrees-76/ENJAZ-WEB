using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            // This returns mock data that matches the react dashboard state
            return Ok(new
            {
                TotalSamples = 1284,
                Completed = 942,
                Certificates = 856,
                Delayed = 23
            });
        }
    }
}
