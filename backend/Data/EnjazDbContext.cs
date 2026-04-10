using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class EnjazDbContext : DbContext
    {
        public EnjazDbContext(DbContextOptions<EnjazDbContext> options)
            : base(options)
        {
        }

        public DbSet<Models.User> Users { get; set; }
        public DbSet<Models.SampleReception> SampleReceptions { get; set; }
        public DbSet<Models.ReceptionSample> ReceptionSamples { get; set; }
        
        // Added for Certificate Numbering Logic
        public DbSet<Models.Certificate> Certificates { get; set; }
        public DbSet<Models.Sample> Samples { get; set; }

        // Administrative Procedures — Referral Letters
        public DbSet<Models.ReferralLetter> ReferralLetters { get; set; }
        public DbSet<Models.ReferralLetterCertificate> ReferralLetterCertificates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Models.SampleReception>()
                .HasMany(r => r.Samples)
                .WithOne(s => s.SampleReception)
                .HasForeignKey(s => s.SampleReceptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Models.Certificate>()
                .HasMany(c => c.Samples)
                .WithOne(s => s.Certificate)
                .HasForeignKey(s => s.CertificateId)
                .OnDelete(DeleteBehavior.Cascade);

            // Report Performance Indexes
            modelBuilder.Entity<Models.Certificate>()
                .HasIndex(c => c.IssueDate);

            modelBuilder.Entity<Models.Certificate>()
                .HasIndex(c => c.Sender);

            modelBuilder.Entity<Models.Certificate>()
                .HasIndex(c => c.CertificateType);

            // ═══════════════════════════════════════════════
            // Referral Letter Configuration
            // ═══════════════════════════════════════════════

            // ReferralLetter → LinkedCertificates (One-to-Many, Cascade)
            modelBuilder.Entity<Models.ReferralLetter>()
                .HasMany(r => r.LinkedCertificates)
                .WithOne(lc => lc.ReferralLetter)
                .HasForeignKey(lc => lc.ReferralLetterId)
                .OnDelete(DeleteBehavior.Cascade);

            // ReferralLetterCertificate → Certificate (Many-to-One, Restrict)
            modelBuilder.Entity<Models.ReferralLetterCertificate>()
                .HasOne(lc => lc.Certificate)
                .WithMany()
                .HasForeignKey(lc => lc.CertificateId)
                .OnDelete(DeleteBehavior.Restrict);

            // Performance Indexes
            modelBuilder.Entity<Models.ReferralLetter>()
                .HasIndex(r => r.SenderName);

            modelBuilder.Entity<Models.ReferralLetter>()
                .HasIndex(r => r.GeneratedAt);

            modelBuilder.Entity<Models.ReferralLetter>()
                .HasIndex(r => r.ReferenceNumber)
                .IsUnique();

            // Soft Delete Global Query Filter
            modelBuilder.Entity<Models.ReferralLetter>()
                .HasQueryFilter(r => !r.IsDeleted);
        }
    }
}
