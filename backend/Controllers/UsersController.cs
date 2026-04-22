using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models.DTOs;
using backend.Services;
using System.Security.Claims;
using Asp.Versioning;

namespace backend.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/users")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>جلب جميع المستخدمين</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>جلب مستخدم واحد بمعرفه</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound(new { message = "المستخدم غير موجود" });
            return Ok(user);
        }

        /// <summary>إنشاء مستخدم جديد</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (user, error) = await _userService.CreateUserAsync(dto, GetUserId(), GetUserFullName());
            if (error != null) return Conflict(new { message = error });
            return CreatedAtAction(nameof(GetById), new { id = user!.Id }, user);
        }

        /// <summary>تحديث بيانات مستخدم</summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (user, error) = await _userService.UpdateUserAsync(id, dto, GetUserId(), GetUserFullName());
            if (error != null)
            {
                if (error == "المستخدم غير موجود") return NotFound(new { message = error });
                return Conflict(new { message = error });
            }
            return Ok(user);
        }

        /// <summary>تجميد/تنشيط مستخدم</summary>
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var (success, error) = await _userService.ToggleUserStatusAsync(id, GetUserId());
            if (!success)
            {
                if (error == "المستخدم غير موجود") return NotFound(new { message = error });
                return BadRequest(new { message = error });
            }
            return Ok(new { message = "تم تحديث حالة المستخدم بنجاح" });
        }

        /// <summary>إحصائيات المستخدمين</summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _userService.GetStatsAsync();
            return Ok(stats);
        }

        /// <summary>فحص تفرد اسم المستخدم</summary>
        [HttpGet("check-username")]
        public async Task<IActionResult> CheckUsername([FromQuery] string username, [FromQuery] int? excludeId)
        {
            var isUnique = await _userService.IsUsernameUniqueAsync(username, excludeId);
            return Ok(new { isUnique });
        }

        // ═══════════════════════════════════════
        // Delete User
        // ═══════════════════════════════════════

        /// <summary>حذف مستخدم</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, error) = await _userService.DeleteUserAsync(id, GetUserId());
            if (!success)
            {
                if (error == "المستخدم غير موجود") return NotFound(new { message = error });
                return BadRequest(new { message = error });
            }
            return NoContent();
        }

        // ═══════════════════════════════════════
        // Helpers
        // ═══════════════════════════════════════

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : 0;
        }

        private string? GetUserFullName()
        {
            return User.FindFirst("fullName")?.Value;
        }
    }
}
