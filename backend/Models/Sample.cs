using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Sample
    {
        [Key]
        public int Id { get; set; }

        public int CertificateId { get; set; }
        
        [ForeignKey(nameof(CertificateId))]
        public Certificate? Certificate { get; set; }

        public int Root { get; set; }
        
        public string? SampleNumber { get; set; }
        
        public string? Description { get; set; }
        
        public DateTime? MeasurementDate { get; set; }
        
        public string? Result { get; set; }
        
        public string? IsotopeK40 { get; set; }
        
        public string? IsotopeRa226 { get; set; }
        
        public string? IsotopeTh232 { get; set; }
        
        public string? IsotopeRa { get; set; }
        
        public string? IsotopeCs137 { get; set; }
    }
}
