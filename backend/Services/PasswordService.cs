using System.Security.Cryptography;
using System.Text;

namespace backend.Services
{
    /// <summary>
    /// خدمة تشفير كلمات المرور — PBKDF2 + SHA256 + Salt
    /// متوافقة مع تنسيق النظام القديم (v2:{iterations}:{salt}:{hash})
    /// </summary>
    public class PasswordService
    {
        private const int SaltSize = 16;     // 128-bit
        private const int KeySize = 32;      // 256-bit
        private const int Iterations = 100000;

        /// <summary>
        /// تشفير كلمة المرور باستخدام PBKDF2
        /// </summary>
        public string HashPassword(string password)
        {
            using var algorithm = new Rfc2898DeriveBytes(
                password,
                SaltSize,
                Iterations,
                HashAlgorithmName.SHA256);

            var key = Convert.ToBase64String(algorithm.GetBytes(KeySize));
            var salt = Convert.ToBase64String(algorithm.Salt);

            // Format: v2:iterations:salt:hash
            return $"v2:{Iterations}:{salt}:{key}";
        }

        /// <summary>
        /// التحقق من تطابق كلمة المرور (يدعم التشفير القديم والجديد)
        /// </summary>
        public bool VerifyPassword(string password, string hash)
        {
            if (string.IsNullOrEmpty(hash)) return false;

            // Handle legacy SHA256 hashes (v1 — without salt)
            if (!hash.StartsWith("v2:"))
            {
                string legacyHash = HashPasswordLegacy(password);
                return legacyHash.Equals(hash, StringComparison.OrdinalIgnoreCase);
            }

            try
            {
                var parts = hash.Split(':');
                if (parts.Length != 4) return false;

                var iterations = int.Parse(parts[1]);
                var salt = Convert.FromBase64String(parts[2]);
                var key = Convert.FromBase64String(parts[3]);

                using var algorithm = new Rfc2898DeriveBytes(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256);

                var keyToCheck = algorithm.GetBytes(KeySize);

                // FixedTimeEquals prevents timing attacks
                return CryptographicOperations.FixedTimeEquals(key, keyToCheck);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// توليد كلمة مرور عشوائية آمنة
        /// </summary>
        public string GenerateRandomPassword(int length = 16)
        {
            const string chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
            var data = RandomNumberGenerator.GetBytes(length);
            var result = new char[length];
            for (int i = 0; i < length; i++)
            {
                result[i] = chars[data[i] % chars.Length];
            }
            return new string(result);
        }

        /// <summary>
        /// تشفير SHA256 القديم (للتوافقية فقط — لا يُستخدم للتشفير الجديد)
        /// </summary>
        private static string HashPasswordLegacy(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            var builder = new StringBuilder();
            foreach (byte b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }
}
