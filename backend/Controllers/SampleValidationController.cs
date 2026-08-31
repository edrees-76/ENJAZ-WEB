using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using backend.Models;
using backend.Services;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/sample-validation")]
    [ApiController]
    [Authorize]
    public class SampleValidationController : ControllerBase
    {
        private readonly ISampleValidationService _validationService;

        public SampleValidationController(ISampleValidationService validationService)
        {
            _validationService = validationService;
        }

        /// <summary>
        /// فحص تفرد عينة مفردة في الوقت الفعلي (Real-time single check)
        /// </summary>
        [HttpPost("check")]
        public async Task<IActionResult> CheckSample([FromBody] SampleValidationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SampleNumber))
            {
                return Ok(new SampleUniquenessResult
                {
                    Status = SampleCheckResult.Unique,
                    Code = "UNIQUE",
                    Message = "رقم العينة فارغ."
                });
            }

            int year = request.Year > 0 ? request.Year : DateTime.UtcNow.Year;

            var result = await _validationService.CheckSampleUniquenessAsync(
                request.SampleNumber,
                year,
                request.Sender,
                request.ExcludeCertificateId,
                request.ExcludeReceptionId,
                request.SourceReceptionId);

            return Ok(result);
        }

        /// <summary>
        /// فحص دفعة عينات دفعة واحدة (Batch check) عند تغيير الجهة المرسلة أو السنة المالية
        /// </summary>
        [HttpPost("check-batch")]
        public async Task<IActionResult> CheckBatch([FromBody] SampleBatchValidationRequest request)
        {
            if (request.SampleNumbers == null || request.SampleNumbers.Count == 0)
            {
                return Ok(new SampleBatchValidationResponse());
            }

            if (request.Year <= 0)
            {
                request.Year = DateTime.UtcNow.Year;
            }

            var response = await _validationService.CheckBatchUniquenessAsync(request);
            return Ok(response);
        }
    }
}
