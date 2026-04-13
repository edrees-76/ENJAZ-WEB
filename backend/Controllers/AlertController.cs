using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/alerts")]
    [ApiController]
    [Authorize]
    public class AlertController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        private int GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("هوية المستخدم غير متوفرة.");
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _alertService.GetActiveAlertsAsync(GetUserId());
            return Ok(alerts);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await _alertService.GetUnreadCountAsync(GetUserId());
            return Ok(new { count });
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _alertService.MarkAsReadAsync(GetUserId(), id);
            return Ok();
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            await _alertService.MarkAllAsReadAsync(GetUserId());
            return Ok();
        }

        /// <summary>
        /// تشغيل يدوي لفحص العينات المتأخرة (لأغراض الاختبار أو كـ Admin)
        /// </summary>
        [HttpPost("process-delayed")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ProcessDelayed()
        {
            await _alertService.ProcessDelayedSamplesAlertsAsync();
            return Ok(new { message = "تم تشغيل عملية فحص العينات المتأخرة بنجاح" });
        }
    }
}
