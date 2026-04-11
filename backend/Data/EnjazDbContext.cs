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

        // User Management — Audit & Security
        public DbSet<Models.AuditLog> AuditLogs { get; set; }
        public DbSet<Models.RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ═══════════════════════════════════════════════
            // User Configuration
            // ═══════════════════════════════════════════════
            modelBuilder.Entity<Models.User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
                entity.Property(u => u.Role).HasConversion<int>();
                entity.Property(u => u.Permissions).HasConversion<int>();

                // Ignore computed properties
                entity.Ignore(u => u.IsAdmin);
                entity.Ignore(u => u.RoleDisplayName);
                entity.Ignore(u => u.StatusDisplayName);
                entity.Ignore(u => u.CanIssueCertificates);
                entity.Ignore(u => u.CanEditCertificates);
                entity.Ignore(u => u.CanManageUsers);
            });

            // ═══════════════════════════════════════════════
            // AuditLog Configuration
            // ═══════════════════════════════════════════════
            modelBuilder.Entity<Models.AuditLog>(entity =>
            {
                entity.HasIndex(a => a.Timestamp);
                entity.HasIndex(a => a.UserId);

                entity.HasOne(a => a.User)
                    .WithMany(u => u.AuditLogs)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ═══════════════════════════════════════════════
            // RefreshToken Configuration
            // ═══════════════════════════════════════════════
            modelBuilder.Entity<Models.RefreshToken>(entity =>
            {
                entity.HasIndex(r => r.Token).IsUnique();
                entity.HasIndex(r => r.UserId);

                // Ignore computed properties
                entity.Ignore(r => r.IsExpired);
                entity.Ignore(r => r.IsValid);

                entity.HasOne(r => r.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ═══════════════════════════════════════════════
            // Sample Reception Configuration (existing)
            // ═══════════════════════════════════════════════
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
