using System;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Services
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync(string period, string timezone, int? targetYear = null);
    }
}
