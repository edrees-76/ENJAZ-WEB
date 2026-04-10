using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginRequest request)
        {
            // Log for debugging
            Console.WriteLine($"\n[AUTH] Login Attempt - Username: {request.Username}");

            // Initial mock authentication
            if (request.Username == "admin" && request.Password == "admin")
            {
                Console.WriteLine("[AUTH] Admin login successful");
                var token = GenerateToken("admin", "Admin");
                return Ok(new { Token = token, Username = "admin", Role = "Admin" });
            }
            if (request.Username == "tech" && request.Password == "tech")
            {
                Console.WriteLine("[AUTH] Tech login successful");
                var token = GenerateToken("tech", "Technician");
                return Ok(new { Token = token, Username = "tech", Role = "Technician" });
            }

            Console.WriteLine($"[AUTH] Login failed for user: {request.Username}");
            return Unauthorized(new { message = "Invalid credentials" });
        }

        private string GenerateToken(string username, string role)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "a_very_long_secret_key_for_enjaz_system_12345!"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, username),
                new Claim(ClaimTypes.Role, role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(4),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class UserLoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
