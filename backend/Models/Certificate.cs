using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Certificate
    {
        [Key]
        public int Id { get; set; }

        public string CertificateNumber { get; set; } = string.Empty;
        
        public string RecipientName { get; set; } = string.Empty;
        
        public string CertificateType { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public DateTime IssueDate { get; set; }
        
        public DateTime? ExpiryDate { get; set; }
        
        public string? IssuingAuthority { get; set; }
        
        public int CreatedBy { get; set; }
        
        public string? CreatedByName { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public string? AnalysisType { get; set; }
        
        public string? Sender { get; set; }
        
        public string? Supplier { get; set; }
        
        public string? Origin { get; set; }
        
        public string? DeclarationNumber { get; set; }
        
        public string? PolicyNumber { get; set; }
        
        public string? NotificationNumber { get; set; }
        
        public string? FinancialReceiptNumber { get; set; }
        
        public string? SpecialistName { get; set; }
        
        public string? SectionHeadName { get; set; }
        
        public string? ManagerName { get; set; }
        
        public string? Notes { get; set; }

        // Associated Reception if this certificate was fully generated from a Reception
        public int? SampleReceptionId { get; set; }
        [ForeignKey(nameof(SampleReceptionId))]
        public SampleReception? SampleReception { get; set; }

        // One-to-Many with Certificate Samples
        public ICollection<Sample> Samples { get; set; } = new List<Sample>();
    }
}
