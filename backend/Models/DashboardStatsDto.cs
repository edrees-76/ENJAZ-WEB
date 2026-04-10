using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class DashboardStatsDto
    {
        public int TotalSamples { get; set; }
        public int SamplesToday { get; set; }
        public int SamplesEnvironmental { get; set; }
        public int SamplesConsumable { get; set; }
        
        public int TotalCertificates { get; set; }
        public int CertificatesToday { get; set; }
        public int CertificatesEnvironmental { get; set; }
        public int CertificatesConsumable { get; set; }
        
        public List<MonthlyStat> MonthlySamples { get; set; } = new List<MonthlyStat>();
        public List<MonthlyStat> MonthlyCertificates { get; set; } = new List<MonthlyStat>();
    }

    public class MonthlyStat
    {
        public string Month { get; set; } = string.Empty;
        public int Environmental { get; set; }
        public int Consumable { get; set; }
    }
}
