using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class UserAlert
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int AlertId { get; set; }

        /// <summary>هل تمت القراءة؟</summary>
        public bool IsRead { get; set; } = false;

        public DateTime? SeenAt { get; set; }

        // Navigation Properties
        [JsonIgnore]
        public User? User { get; set; }

        [JsonIgnore]
        public Alert? Alert { get; set; }
    }
}
