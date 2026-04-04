using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CertificatesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetCertificates()
        {
            return Ok(new[] {
                new { Id = 1, CertNo = "C-4991", SampleId = 1, IssueDate = System.DateTime.UtcNow.AddHours(-5) }
            });
        }

        [HttpPost("{id}/pdf")]
        public IActionResult GeneratePdf(int id)
        {
            return Ok(new { message = $"PDF generated for certificate {id}" });
        }
    }
}
