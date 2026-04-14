using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Bitmask enum for referral letter column selection.
    /// Stored as int in DB for type-safety and efficient querying.
    /// </summary>
    [Flags]
    public enum ReferralColumns
    {
        None = 0,
        CertificateNumber = 1,
        Supplier = 2,
        Samples = 4,
        NotificationNumber = 8,
        All = CertificateNumber | Supplier | Samples | NotificationNumber
    }

    /// <summary>
    /// Represents a referral letter — an official cover document
    /// grouping certificates issued for a specific sender within a date range.
    /// </summary>
    public class ReferralLetter
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Official reference number (e.g., REF-2026-000123).
        /// Auto-generated on creation.
        /// </summary>
        [Required]
        [MaxLength(30)]
        public string ReferenceNumber { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp of when this letter was generated.
        /// </summary>
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The sender/entity this letter is addressed to.
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string SenderName { get; set; } = string.Empty;

        /// <summary>
        /// Number of certificates included in this letter.
        /// </summary>
        public int CertificateCount { get; set; }

        /// <summary>
        /// Total sample count across all linked certificates.
        /// </summary>
        public int SampleCount { get; set; }

        /// <summary>
        /// Start of the date range used to query certificates.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End of the date range used to query certificates.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Bitmask of which columns were included in the generated PDF table.
        /// Stored as int for type-safety.
        /// </summary>
        public ReferralColumns IncludedColumns { get; set; } = ReferralColumns.All;

        /// <summary>
        /// File system path to the generated PDF.
        /// Null if not yet generated or file was cleaned up.
        /// </summary>
        [MaxLength(500)]
        public string? PdfPath { get; set; }

        /// <summary>
        /// Version of the PDF template used during generation.
        /// Allows future template changes without affecting old letters.
        /// </summary>
        public int TemplateVersion { get; set; } = 1;

        /// <summary>
        /// Name of the user who generated this letter (audit trail).
        /// </summary>
        [MaxLength(100)]
        public string? CreatedByName { get; set; }

        /// <summary>
        /// Soft delete flag. Deleted letters are hidden from queries
        /// but preserved in the database for audit compliance.
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Navigation property: certificates linked to this letter (snapshot).
        /// </summary>
        public ICollection<ReferralLetterCertificate> LinkedCertificates { get; set; }
            = new List<ReferralLetterCertificate>();
    }
}
