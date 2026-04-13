using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.tests
{
    /// <summary>
    /// Shared test utilities for creating in-memory database contexts.
    /// </summary>
    public static class TestDbHelper
    {
        public static EnjazDbContext CreateInMemoryContext(string? dbName = null)
        {
            var options = new DbContextOptionsBuilder<EnjazDbContext>()
                .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
                .Options;

            var context = new EnjazDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }
    }
}
