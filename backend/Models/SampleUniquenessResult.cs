using System;
using System.Collections.Generic;

namespace backend.Models
{
    public enum SampleCheckResult
    {
        /// <summary>العينة فريدة ولا يوجد أي تكرار</summary>
        Unique = 0,

        /// <summary>العينة مكررة ومسجلة في شهادة أو استلام نشط (يمنع الحفظ 409 Conflict)</summary>
        DuplicateActive = 1,

        /// <summary>العينة مكررة داخل نفس الحزمة/النموذج (يمنع الحفظ 409 Conflict)</summary>
        DuplicateInPayload = 2,

        /// <summary>العينة موجودة في سجل محذوفات سابق (تنبيه تحذيري 200 OK مع تفاصيل السجل المحذوف)</summary>
        FoundInDeleted = 3
    }

    public class SampleUniquenessResult
    {
        public SampleCheckResult Status { get; set; } = SampleCheckResult.Unique;
        
        /// <summary>رمز الخطأ البرمجي المنظم (مثل SAMPLE_DUPLICATE_ACTIVE, UNIQUE, FOUND_IN_DELETED)</summary>
        public string Code { get; set; } = "UNIQUE";

        /// <summary>الرقم الأصلي المدخل</summary>
        public string SampleNumber { get; set; } = string.Empty;

        /// <summary>الرقم بعد التطبيع</summary>
        public string NormalizedSampleNumber { get; set; } = string.Empty;

        /// <summary>الرسالة التوضيحية بالعربية</summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>المصدر المتطابق (شهادة نشطة / استلام عينات نشط / سجل محذوفات)</summary>
        public string? MatchedSource { get; set; }

        /// <summary>المعرف أو الرقم المرجعي للسجل المطابق (مثل رقم الشهادة RM-C-26-0001 أو رقم الإخطار)</summary>
        public string? MatchedIdentifier { get; set; }

        /// <summary>اسم الجهة المرسلة في السجل المتطابق</summary>
        public string? MatchedSender { get; set; }

        /// <summary>السنة المالية / الميلادية</summary>
        public int? Year { get; set; }

        /// <summary>المعرف الفريد للسجل المطابق في قاعدة البيانات</summary>
        public int? MatchedRecordId { get; set; }

        /// <summary>تاريخ السجل المطابق</summary>
        public DateTime? MatchedDate { get; set; }
    }

    public class SampleValidationRequest
    {
        public string SampleNumber { get; set; } = string.Empty;
        public int Year { get; set; }
        public string? Sender { get; set; }
        public int? ExcludeCertificateId { get; set; }
        public int? ExcludeReceptionId { get; set; }
        public int? SourceReceptionId { get; set; }
    }

    public class SampleBatchValidationRequest
    {
        public List<string> SampleNumbers { get; set; } = new();
        public int Year { get; set; }
        public string? Sender { get; set; }
        public int? ExcludeCertificateId { get; set; }
        public int? ExcludeReceptionId { get; set; }
        public int? SourceReceptionId { get; set; }
    }

    public class SampleBatchValidationResponse
    {
        public bool HasDuplicates { get; set; }
        public bool HasDeletedWarnings { get; set; }
        public List<SampleUniquenessResult> Results { get; set; } = new();
    }

    /// <summary>
    /// استثناء خاص عند محاولة حفظ عينة مكررة ينتج عنه استجابة 409 Conflict
    /// </summary>
    public class DuplicateSampleException : Exception
    {
        public SampleUniquenessResult Result { get; }

        public DuplicateSampleException(SampleUniquenessResult result)
            : base(result.Message)
        {
            Result = result;
        }
    }
}
