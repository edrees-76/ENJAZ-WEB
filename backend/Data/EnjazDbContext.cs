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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Models.SampleReception>()
                .HasMany(r => r.Samples)
                .WithOne(s => s.SampleReception)
                .HasForeignKey(s => s.SampleReceptionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
