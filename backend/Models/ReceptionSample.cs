using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ReceptionSample
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SampleReceptionId { get; set; }

        [Required]
        public string SampleNumber { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string? Root { get; set; }

        // Navigation property for One-to-Many relationship
        [ForeignKey("SampleReceptionId")]
        public SampleReception? SampleReception { get; set; }
    }
}
