using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // ═══════════════════════════════════════════════
    // ReportColumn Enum (Type-Safe بدل string)
    // ═══════════════════════════════════════════════
    public enum ReportColumn
    {
        CertificateNumber,
        CertificateType,
        AnalysisType,
        Sender,
        Supplier,
        Origin,
        NotificationNumber,
        DeclarationNumber,
        FinancialReceiptNumber,
        SampleCount,
        EnvSampleCount,
        ConsSampleCount,
        CreatedByName,
        IssueDate
    }

    // ═══════════════════════════════════════════════
    // ReportRequest — طلب استخراج التقرير (مع Validation)
    // ═══════════════════════════════════════════════
    public class ReportRequest
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Sender { get; set; }

        /// <summary>
        /// اسم الجهة المرسلة (يُستخدم في عنوان تقرير الجهة)
        /// </summary>
        public string? SenderName { get; set; }

        /// <summary>
        /// نوع التقرير: general = تقرير عام, sender = تقرير جهة مرسلة
        /// </summary>
        public string ReportType { get; set; } = "general";

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;

        public List<ReportColumn> Columns { get; set; } = new();
    }

    // ═══════════════════════════════════════════════
    // PagedResult<T> — قابل لإعادة الاستخدام
    // ═══════════════════════════════════════════════
    public class PagedResult<T>
    {
        public List<T> Data { get; set; } = new();
        public int TotalCount { get; set; }
    }

    // ═══════════════════════════════════════════════
    // ReportSummaryDto — ملخص إحصائي + رسوم بيانية
    // ═══════════════════════════════════════════════
    public class ReportSummaryDto
    {
        public int TotalCertificates { get; set; }
        public int TotalSamples { get; set; }
        public int EnvironmentalCertificates { get; set; }
        public int ConsumableCertificates { get; set; }
        public int EnvironmentalSamples { get; set; }
        public int ConsumableSamples { get; set; }

        public List<ChartDataPoint> Timeline { get; set; } = new();
        public List<ChartDataPoint> CertDistribution { get; set; } = new();
        public List<ChartDataPoint> TopSuppliers { get; set; } = new();
        public List<ChartDataPoint> TopSenders { get; set; } = new();
        public List<ChartDataPoint> TopOrigins { get; set; } = new();
        public List<ChartDataPoint> MonthlyPerformance { get; set; } = new();
        public List<ChartDataPoint> SampleTypeComparison { get; set; } = new();
        public List<ChartDataPoint> TopAnalysisTypes { get; set; } = new();
    }

    // ═══════════════════════════════════════════════
    // ChartDataPoint — نقطة بيانات للرسوم البيانية
    // ═══════════════════════════════════════════════
    public class ChartDataPoint
    {
        public string Label { get; set; } = string.Empty;
        public int Value { get; set; }
        public int? Value2 { get; set; }
    }

    // ═══════════════════════════════════════════════
    // CertificateReportRow — صف بيانات تفصيلي للجدول
    // ═══════════════════════════════════════════════
    public class CertificateReportRow
    {
        public string CertificateNumber { get; set; } = string.Empty;
        public string CertificateType { get; set; } = string.Empty;
        public string? AnalysisType { get; set; }
        public string? Sender { get; set; }
        public string? Supplier { get; set; }
        public string? Origin { get; set; }
        public string? NotificationNumber { get; set; }
        public string? DeclarationNumber { get; set; }
        public string? FinancialReceiptNumber { get; set; }
        public int SampleCount { get; set; }
        public int EnvSampleCount { get; set; }
        public int ConsSampleCount { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime IssueDate { get; set; }
    }
}
