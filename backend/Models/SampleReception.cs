using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class SampleReception
    {
        [Key]
        public int Id { get; set; }
        
        public int Sequence { get; set; }

        [Required]
        public string AnalysisRequestNumber { get; set; } = string.Empty;

        public string? NotificationNumber { get; set; }
        public string? DeclarationNumber { get; set; }
        public string? Supplier { get; set; }
        
        [Required]
        public string Sender { get; set; } = string.Empty;
        
        public string? Origin { get; set; }
        public string? PolicyNumber { get; set; }
        public string? FinancialReceiptNumber { get; set; }

        [Required]
        public string CertificateType { get; set; } = "عينات بيئية";

        public DateTime Date { get; set; } = DateTime.Now;

        public string Status { get; set; } = "لم يتم إصدار شهادة";

        public int CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int? UpdatedBy { get; set; }
        public string? UpdatedByName { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property for One-to-Many relationship
        public List<ReceptionSample> Samples { get; set; } = new List<ReceptionSample>();
    }
}
