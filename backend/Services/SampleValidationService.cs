using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Helpers;
using backend.Models;

namespace backend.Services
{
    public interface ISampleValidationService
    {
        Task<SampleUniquenessResult> CheckSampleUniquenessAsync(
            string sampleNumber,
            int year,
            string? sender,
            int? excludeCertificateId = null,
            int? excludeReceptionId = null,
            int? sourceReceptionId = null);

        Task<SampleBatchValidationResponse> CheckBatchUniquenessAsync(SampleBatchValidationRequest request);

        Task ValidateCertificateSamplesBeforeSaveAsync(Certificate certificate, int? excludeCertificateId = null);

        Task ValidateReceptionSamplesBeforeSaveAsync(SampleReception reception, int? excludeReceptionId = null);
    }

    public class SampleValidationService : ISampleValidationService
    {
        private readonly EnjazDbContext _context;

        public SampleValidationService(EnjazDbContext context)
        {
            _context = context;
        }

        public async Task<SampleUniquenessResult> CheckSampleUniquenessAsync(
            string sampleNumber,
            int year,
            string? sender,
            int? excludeCertificateId = null,
            int? excludeReceptionId = null,
            int? sourceReceptionId = null)
        {
            string normSample = SampleValidationHelper.NormalizeSampleNumber(sampleNumber);
            string normSender = SampleValidationHelper.NormalizeSender(sender);

            if (string.IsNullOrEmpty(normSample))
            {
                return new SampleUniquenessResult
                {
                    Status = SampleCheckResult.Unique,
                    Code = "UNIQUE",
                    SampleNumber = sampleNumber ?? string.Empty,
                    NormalizedSampleNumber = string.Empty,
                    Message = "رقم العينة فارغ."
                };
            }

            // ═════════════════════════════════════════════════════════════════
            // 1. فحص الشهادات النشطة (Active Certificates)
            // ═════════════════════════════════════════════════════════════════
            var certQuery = _context.Certificates
                .AsNoTracking()
                .Include(c => c.Samples)
                .Where(c => c.IssueDate.Year == year);

            if (excludeCertificateId.HasValue && excludeCertificateId.Value > 0)
            {
                certQuery = certQuery.Where(c => c.Id != excludeCertificateId.Value);
            }

            var certCandidates = await certQuery.ToListAsync();

            foreach (var cert in certCandidates)
            {
                if (!string.IsNullOrEmpty(normSender))
                {
                    string certNormSender = SampleValidationHelper.NormalizeSender(cert.Sender);
                    if (certNormSender != normSender)
                        continue;
                }

                if (cert.Samples == null) continue;

                foreach (var s in cert.Samples)
                {
                    if (SampleValidationHelper.NormalizeSampleNumber(s.SampleNumber) == normSample)
                    {
                        string senderDisplay = !string.IsNullOrWhiteSpace(cert.Sender) ? cert.Sender : "الجهة الحالية";
                        return new SampleUniquenessResult
                        {
                            Status = SampleCheckResult.DuplicateActive,
                            Code = "SAMPLE_DUPLICATE_ACTIVE_CERTIFICATE",
                            SampleNumber = sampleNumber,
                            NormalizedSampleNumber = normSample,
                            Message = $"رقم العينة ({sampleNumber}) مكرر ومسجل بالفعل في شهادة نشطة برقم ({cert.CertificateNumber}) لسنة ({year}) - الجهة: ({senderDisplay}).",
                            MatchedSource = "شهادة نشطة",
                            MatchedIdentifier = cert.CertificateNumber,
                            MatchedSender = cert.Sender,
                            Year = year,
                            MatchedRecordId = cert.Id,
                            MatchedDate = cert.IssueDate
                        };
                    }
                }
            }

            // ═════════════════════════════════════════════════════════════════
            // 2. فحص استلامات العينات النشطة (Active Sample Receptions)
            // ملاحظة دورة الحياة: إذا كانت الشهادة تُنشأ من استلام عينات أصلي (sourceReceptionId)،
            // فإن عينات ذلك الاستلام لا تعتبر تكراراً لأنها نفس الكيان.
            // ═════════════════════════════════════════════════════════════════
            var recQuery = _context.SampleReceptions
                .AsNoTracking()
                .Include(r => r.Samples)
                .Where(r => r.Date.Year == year);

            if (excludeReceptionId.HasValue && excludeReceptionId.Value > 0)
            {
                recQuery = recQuery.Where(r => r.Id != excludeReceptionId.Value);
            }

            if (sourceReceptionId.HasValue && sourceReceptionId.Value > 0)
            {
                recQuery = recQuery.Where(r => r.Id != sourceReceptionId.Value);
            }

            var recCandidates = await recQuery.ToListAsync();

            foreach (var rec in recCandidates)
            {
                if (!string.IsNullOrEmpty(normSender))
                {
                    string recNormSender = SampleValidationHelper.NormalizeSender(rec.Sender);
                    if (recNormSender != normSender)
                        continue;
                }

                if (rec.Samples == null) continue;

                foreach (var s in rec.Samples)
                {
                    if (SampleValidationHelper.NormalizeSampleNumber(s.SampleNumber) == normSample)
                    {
                        string senderDisplay = !string.IsNullOrWhiteSpace(rec.Sender) ? rec.Sender : "الجهة الحالية";
                        string refInfo = !string.IsNullOrWhiteSpace(rec.AnalysisRequestNumber)
                            ? $"طلب تحليل {rec.AnalysisRequestNumber}"
                            : (!string.IsNullOrWhiteSpace(rec.NotificationNumber) ? $"إخطار {rec.NotificationNumber}" : $"استلام رقم {rec.Sequence}");

                        return new SampleUniquenessResult
                        {
                            Status = SampleCheckResult.DuplicateActive,
                            Code = "SAMPLE_DUPLICATE_ACTIVE_RECEPTION",
                            SampleNumber = sampleNumber,
                            NormalizedSampleNumber = normSample,
                            Message = $"رقم العينة ({sampleNumber}) مكرر ومسجل بالفعل في استلام عينات نشط ({refInfo}) لسنة ({year}) - الجهة: ({senderDisplay}).",
                            MatchedSource = "استلام عينات نشط",
                            MatchedIdentifier = refInfo,
                            MatchedSender = rec.Sender,
                            Year = year,
                            MatchedRecordId = rec.Id,
                            MatchedDate = rec.Date
                        };
                    }
                }
            }

            // ═════════════════════════════════════════════════════════════════
            // 3. فحص سجلات المحذوفات (AuditLogs) للتنبيه والتحذير
            // ═════════════════════════════════════════════════════════════════
            var auditQuery = _context.AuditLogs
                .AsNoTracking()
                .Where(a => a.Timestamp.Year == year &&
                            (a.Action.Contains("حذف") || a.Action.Contains("Delete")));

            var deletedLogs = await auditQuery.ToListAsync();

            foreach (var log in deletedLogs)
            {
                if (string.IsNullOrWhiteSpace(log.Details)) continue;

                // مطابقة اسم الجهة إذا توفرت في تفاصيل الحذف
                if (!string.IsNullOrEmpty(normSender))
                {
                    string logNormDetails = SampleValidationHelper.NormalizeSender(log.Details);
                    if (!logNormDetails.Contains(normSender))
                    {
                        // إذا كانت تفاصيل السجل تحتوي على اسم جهة أخرى مختلفة، نتجاوز
                    }
                }

                // استخراج الأرقام من تفاصيل الحذف للتأكد من مطابقة رقم العينة
                bool matchesSample = IsSampleInDeletedDetails(log.Details, normSample);
                if (matchesSample)
                {
                    return new SampleUniquenessResult
                    {
                        Status = SampleCheckResult.FoundInDeleted,
                        Code = "FOUND_IN_DELETED",
                        SampleNumber = sampleNumber,
                        NormalizedSampleNumber = normSample,
                        Message = $"تنبيه: رقم العينة ({sampleNumber}) كان مستخدماً في سجل محذوف سابقاً بتاريخ ({log.Timestamp:yyyy-MM-dd HH:mm}) بواسطة ({log.UserName ?? "المستخدم"}).",
                        MatchedSource = "سجل محذوفات سابق",
                        MatchedIdentifier = log.Details.Length > 80 ? log.Details[..80] + "..." : log.Details,
                        MatchedSender = sender,
                        Year = year,
                        MatchedRecordId = log.Id,
                        MatchedDate = log.Timestamp
                    };
                }
            }

            return new SampleUniquenessResult
            {
                Status = SampleCheckResult.Unique,
                Code = "UNIQUE",
                SampleNumber = sampleNumber,
                NormalizedSampleNumber = normSample,
                Message = "رقم العينة متاح وفريد.",
                Year = year
            };
        }

        public async Task<SampleBatchValidationResponse> CheckBatchUniquenessAsync(SampleBatchValidationRequest request)
        {
            var response = new SampleBatchValidationResponse();

            if (request.SampleNumbers == null || request.SampleNumbers.Count == 0)
            {
                return response;
            }

            // 1. فحص التكرار الداخلي أولاً
            var (hasInternalDups, firstDup, allDups) = SampleValidationHelper.CheckIntraPayloadDuplicates(request.SampleNumbers);
            var seenInternal = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in request.SampleNumbers)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                string norm = SampleValidationHelper.NormalizeSampleNumber(raw);

                if (!seenInternal.Add(norm))
                {
                    // هذا الرقم مكرر داخلياً في نفس القائمة
                    response.Results.Add(new SampleUniquenessResult
                    {
                        Status = SampleCheckResult.DuplicateInPayload,
                        Code = "SAMPLE_DUPLICATE_IN_PAYLOAD",
                        SampleNumber = raw,
                        NormalizedSampleNumber = norm,
                        Message = $"رقم العينة ({raw}) مكرر داخل نفس النموذج المدخل.",
                        Year = request.Year
                    });
                    response.HasDuplicates = true;
                    continue;
                }

                // فحص العينة في قاعدة البيانات
                var result = await CheckSampleUniquenessAsync(
                    raw,
                    request.Year,
                    request.Sender,
                    request.ExcludeCertificateId,
                    request.ExcludeReceptionId,
                    request.SourceReceptionId);

                if (result.Status == SampleCheckResult.DuplicateActive)
                {
                    response.HasDuplicates = true;
                }
                else if (result.Status == SampleCheckResult.FoundInDeleted)
                {
                    response.HasDeletedWarnings = true;
                }

                response.Results.Add(result);
            }

            return response;
        }

        public async Task ValidateCertificateSamplesBeforeSaveAsync(Certificate certificate, int? excludeCertificateId = null)
        {
            if (certificate.Samples == null || certificate.Samples.Count == 0)
                return;

            int year = certificate.IssueDate.Year;
            var sampleNumbers = certificate.Samples.Select(s => s.SampleNumber).ToList();

            // 1. فحص التكرار الداخلي في الـ Payload
            var (hasDups, duplicateNumber, _) = SampleValidationHelper.CheckIntraPayloadDuplicates(sampleNumbers);
            if (hasDups)
            {
                throw new DuplicateSampleException(new SampleUniquenessResult
                {
                    Status = SampleCheckResult.DuplicateInPayload,
                    Code = "SAMPLE_DUPLICATE_IN_PAYLOAD",
                    SampleNumber = duplicateNumber ?? string.Empty,
                    NormalizedSampleNumber = SampleValidationHelper.NormalizeSampleNumber(duplicateNumber),
                    Message = $"لا يمكن الحفظ: يوجد تكرار داخلي لرقم العينة ({duplicateNumber}) داخل قائمة عينات الشهادة.",
                    Year = year
                });
            }

            // 2. فحص قاعدة البيانات لكل عينة
            foreach (var sample in certificate.Samples)
            {
                if (string.IsNullOrWhiteSpace(sample.SampleNumber)) continue;

                var result = await CheckSampleUniquenessAsync(
                    sample.SampleNumber,
                    year,
                    certificate.Sender,
                    excludeCertificateId: excludeCertificateId ?? (certificate.Id > 0 ? certificate.Id : null),
                    sourceReceptionId: certificate.SampleReceptionId);

                if (result.Status == SampleCheckResult.DuplicateActive)
                {
                    throw new DuplicateSampleException(result);
                }
            }
        }

        public async Task ValidateReceptionSamplesBeforeSaveAsync(SampleReception reception, int? excludeReceptionId = null)
        {
            if (reception.Samples == null || reception.Samples.Count == 0)
                return;

            int year = reception.Date.Year;
            var sampleNumbers = reception.Samples.Select(s => s.SampleNumber).ToList();

            // 1. فحص التكرار الداخلي في الـ Payload
            var (hasDups, duplicateNumber, _) = SampleValidationHelper.CheckIntraPayloadDuplicates(sampleNumbers);
            if (hasDups)
            {
                throw new DuplicateSampleException(new SampleUniquenessResult
                {
                    Status = SampleCheckResult.DuplicateInPayload,
                    Code = "SAMPLE_DUPLICATE_IN_PAYLOAD",
                    SampleNumber = duplicateNumber ?? string.Empty,
                    NormalizedSampleNumber = SampleValidationHelper.NormalizeSampleNumber(duplicateNumber),
                    Message = $"لا يمكن الحفظ: يوجد تكرار داخلي لرقم العينة ({duplicateNumber}) داخل قائمة عينات الاستلام.",
                    Year = year
                });
            }

            // 2. فحص قاعدة البيانات لكل عينة
            foreach (var sample in reception.Samples)
            {
                if (string.IsNullOrWhiteSpace(sample.SampleNumber)) continue;

                var result = await CheckSampleUniquenessAsync(
                    sample.SampleNumber,
                    year,
                    reception.Sender,
                    excludeReceptionId: excludeReceptionId ?? (reception.Id > 0 ? reception.Id : null));

                if (result.Status == SampleCheckResult.DuplicateActive)
                {
                    throw new DuplicateSampleException(result);
                }
            }
        }

        private static bool IsSampleInDeletedDetails(string details, string normSample)
        {
            if (string.IsNullOrWhiteSpace(details) || string.IsNullOrWhiteSpace(normSample))
                return false;

            // استخراج الأرقام من النص بطريقة مرنة
            var matches = Regex.Matches(details, @"\b\d+\b");
            foreach (Match match in matches)
            {
                if (SampleValidationHelper.NormalizeSampleNumber(match.Value) == normSample)
                {
                    return true;
                }
            }
            return false;
        }
    }
}
