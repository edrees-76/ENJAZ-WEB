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
        
        public List<ChartDataPoint> ChartSamples { get; set; } = new List<ChartDataPoint>();
        public List<ChartDataPoint> ChartCertificates { get; set; } = new List<ChartDataPoint>();
    }

    public class ChartDataPoint
    {
        public string Label { get; set; } = string.Empty;
        public int Environmental { get; set; }
        public int Consumable { get; set; }
    }
}
