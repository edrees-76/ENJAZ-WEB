using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Junction table linking ReferralLetters to Certificates.
    /// Acts as a snapshot: once a letter is generated, this record preserves
    /// which certificates were included — even if the certificate data changes later.
    /// This is critical for legal/audit integrity of generated PDF documents.
    /// </summary>
    public class ReferralLetterCertificate
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Foreign key to the parent referral letter.
        /// </summary>
        public int ReferralLetterId { get; set; }

        [ForeignKey(nameof(ReferralLetterId))]
        public ReferralLetter ReferralLetter { get; set; } = null!;

        /// <summary>
        /// Foreign key to the linked certificate.
        /// </summary>
        public int CertificateId { get; set; }

        [ForeignKey(nameof(CertificateId))]
        public Certificate Certificate { get; set; } = null!;
    }
}
