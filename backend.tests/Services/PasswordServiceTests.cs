using backend.Services;
using Xunit;

namespace backend.tests.Services
{
    /// <summary>
    /// Tests for PasswordService — hashing and verification.
    /// </summary>
    public class PasswordServiceTests
    {
        private readonly PasswordService _sut = new();

        [Fact]
        public void HashPassword_ReturnsNonEmpty()
        {
            var hash = _sut.HashPassword("TestPassword123!");
            Assert.False(string.IsNullOrWhiteSpace(hash));
        }

        [Fact]
        public void HashPassword_ProducesV2Hash()
        {
            var hash = _sut.HashPassword("TestPassword123!");
            Assert.StartsWith("v2:", hash);
        }

        [Fact]
        public void VerifyPassword_CorrectPassword_ReturnsTrue()
        {
            var password = "SecurePass!2026";
            var hash = _sut.HashPassword(password);
            Assert.True(_sut.VerifyPassword(password, hash));
        }

        [Fact]
        public void VerifyPassword_WrongPassword_ReturnsFalse()
        {
            var hash = _sut.HashPassword("CorrectPassword");
            Assert.False(_sut.VerifyPassword("WrongPassword", hash));
        }

        [Fact]
        public void HashPassword_SameInput_ProducesDifferentHashes()
        {
            var hash1 = _sut.HashPassword("SamePassword");
            var hash2 = _sut.HashPassword("SamePassword");
            Assert.NotEqual(hash1, hash2); // Salt should differ
        }

        [Fact]
        public void VerifyPassword_EmptyPassword_ReturnsFalse()
        {
            var hash = _sut.HashPassword("ValidPassword");
            Assert.False(_sut.VerifyPassword("", hash));
        }

        [Fact]
        public void VerifyPassword_NullHash_ReturnsFalse()
        {
            Assert.False(_sut.VerifyPassword("test", ""));
        }
    }
}
