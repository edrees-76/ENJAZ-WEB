using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using backend.Data;
using backend.Helpers;
using backend.Models;
using backend.Services;

namespace backend.tests.Services
{
    public class SampleValidationTests
    {
        [Theory]
        [InlineData("150", "150")]
        [InlineData("0150", "150")]
        [InlineData("000150", "150")]
        [InlineData(" 150 ", "150")]
        [InlineData("0", "0")]
        [InlineData("00", "0")]
        [InlineData("000", "0")]
        [InlineData("١٥٠", "150")]
        [InlineData("٠٠١٥٠", "150")]
        public void NormalizeSampleNumber_ShouldHandleLeadingZerosAndNumerals(string input, string expected)
        {
            string result = SampleValidationHelper.NormalizeSampleNumber(input);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void NormalizeSender_ShouldApplyLinguisticAndBusinessAliases()
        {
            // Linguistic (Hamzas, Teh Marbouta, Alef Maksoura)
            string s1 = SampleValidationHelper.NormalizeSender("مصلحة الجمارك - ميناء زوارة");
            string s2 = SampleValidationHelper.NormalizeSender("مصلحه الجمارك - ميناء ازواره");
            Assert.Equal(s1, s2);

            // Aliases: "و الادوية" <-> "والادوية"
            string d1 = SampleValidationHelper.NormalizeSender("مركز الرقابة على الاغذية والادوية");
            string d2 = SampleValidationHelper.NormalizeSender("مركز الرقابه علي الاغذيه و الادويه");
            Assert.Equal(d1, d2);
        }

        [Fact]
        public void CheckIntraPayloadDuplicates_ShouldDetectDuplicatesInSameRequest()
        {
            var samples = new List<string> { "150", "200", "0150", "300" };
            var (hasDups, dupNumber, list) = SampleValidationHelper.CheckIntraPayloadDuplicates(samples);

            Assert.True(hasDups);
            Assert.Equal("0150", dupNumber);
            Assert.Single(list);
        }

        [Fact]
        public async Task CheckUniqueness_ShouldDetectDuplicateInActiveCertificates()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            var cert = new Certificate
            {
                Id = 1,
                CertificateNumber = "RM-C-26-0001",
                IssueDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء طرابلس",
                CertificateType = "شهادة جمركية",
                AnalysisType = "تحليل إشعاعي",
                Samples = new List<Sample>
                {
                    new Sample { Id = 1, Root = 1, SampleNumber = "150", Description = "قمح" }
                }
            };
            context.Certificates.Add(cert);
            await context.SaveChangesAsync();

            // Test same number, same year, same sender (different format "0150")
            var result = await service.CheckSampleUniquenessAsync("0150", 2026, "مصلحة الجمارك - ميناء طرابلس");

            Assert.Equal(SampleCheckResult.DuplicateActive, result.Status);
            Assert.Equal("SAMPLE_DUPLICATE_ACTIVE_CERTIFICATE", result.Code);
            Assert.Equal("RM-C-26-0001", result.MatchedIdentifier);
        }

        [Fact]
        public async Task CheckUniqueness_ShouldIsolateDifferentYearsAndSenders()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            var cert = new Certificate
            {
                Id = 1,
                CertificateNumber = "RM-C-26-0001",
                IssueDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء طرابلس",
                CertificateType = "شهادة جمركية",
                AnalysisType = "تحليل إشعاعي",
                Samples = new List<Sample>
                {
                    new Sample { Id = 1, Root = 1, SampleNumber = "150", Description = "قمح" }
                }
            };
            context.Certificates.Add(cert);
            await context.SaveChangesAsync();

            // Different Year (2025) -> Unique
            var resYear = await service.CheckSampleUniquenessAsync("150", 2025, "مصلحة الجمارك - ميناء طرابلس");
            Assert.Equal(SampleCheckResult.Unique, resYear.Status);

            // Different Sender -> Unique
            var resSender = await service.CheckSampleUniquenessAsync("150", 2026, "الشركة العامة للكهرباء");
            Assert.Equal(SampleCheckResult.Unique, resSender.Status);
        }

        [Fact]
        public async Task CheckUniqueness_LifecycleExemption_SourceReceptionShouldNotConflictWithItsCertificate()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            // 1. Existing Reception with sample 150
            var reception = new SampleReception
            {
                Id = 10,
                Sequence = 5,
                Date = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء طرابلس",
                CertificateType = "شهادة جمركية",
                Samples = new List<ReceptionSample>
                {
                    new ReceptionSample { Id = 1, Root = "1", SampleNumber = "150", Description = "أرز" }
                }
            };
            context.SampleReceptions.Add(reception);
            await context.SaveChangesAsync();

            // When checking without sourceReceptionId -> DuplicateActive (found in reception)
            var resWithoutExemption = await service.CheckSampleUniquenessAsync("150", 2026, "مصلحة الجمارك - ميناء طرابلس");
            Assert.Equal(SampleCheckResult.DuplicateActive, resWithoutExemption.Status);

            // When issuing a certificate from this reception (sourceReceptionId = 10) -> Should be Unique!
            var resWithExemption = await service.CheckSampleUniquenessAsync("150", 2026, "مصلحة الجمارك - ميناء طرابلس", sourceReceptionId: 10);
            Assert.Equal(SampleCheckResult.Unique, resWithExemption.Status);
        }

        [Fact]
        public async Task CheckUniqueness_ExcludeCurrentIdOnEdit()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            var cert = new Certificate
            {
                Id = 5,
                CertificateNumber = "RM-C-26-0005",
                IssueDate = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء مصراتة",
                CertificateType = "شهادة جمركية",
                AnalysisType = "تحليل إشعاعي",
                Samples = new List<Sample>
                {
                    new Sample { Id = 1, Root = 1, SampleNumber = "250", Description = "زيت" }
                }
            };
            context.Certificates.Add(cert);
            await context.SaveChangesAsync();

            // Editing Certificate #5 with same sample 250 and excluding ID 5 -> Unique
            var result = await service.CheckSampleUniquenessAsync("250", 2026, "مصلحة الجمارك - ميناء مصراتة", excludeCertificateId: 5);
            Assert.Equal(SampleCheckResult.Unique, result.Status);
        }

        [Fact]
        public async Task CheckUniqueness_ShouldDetectDeletedRecordsInAuditLogs()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            var audit = new AuditLog
            {
                Id = 1,
                Action = "حذف شهادة",
                Details = "تم حذف الشهادة رقم RM-C-26-0099 — العينة رقم 777 — مصلحة الجمارك",
                Timestamp = new DateTime(2026, 2, 10, 10, 30, 0, DateTimeKind.Utc),
                UserName = "admin"
            };
            context.AuditLogs.Add(audit);
            await context.SaveChangesAsync();

            var result = await service.CheckSampleUniquenessAsync("777", 2026, "مصلحة الجمارك");
            Assert.Equal(SampleCheckResult.FoundInDeleted, result.Status);
            Assert.Equal("FOUND_IN_DELETED", result.Code);
        }

        [Fact]
        public async Task ValidateCertificateSamplesBeforeSave_ShouldThrowDuplicateSampleException()
        {
            using var context = TestDbHelper.CreateInMemoryContext();
            var service = new SampleValidationService(context);

            var cert = new Certificate
            {
                Id = 1,
                CertificateNumber = "RM-C-26-0001",
                IssueDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء طرابلس",
                CertificateType = "شهادة جمركية",
                AnalysisType = "تحليل إشعاعي",
                Samples = new List<Sample>
                {
                    new Sample { Id = 1, Root = 1, SampleNumber = "500" }
                }
            };
            context.Certificates.Add(cert);
            await context.SaveChangesAsync();

            // Attempting to save new cert with sample "0500"
            var newCert = new Certificate
            {
                Id = 0,
                IssueDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                Sender = "مصلحة الجمارك - ميناء طرابلس",
                Samples = new List<Sample>
                {
                    new Sample { SampleNumber = "0500" }
                }
            };

            var ex = await Assert.ThrowsAsync<DuplicateSampleException>(() =>
                service.ValidateCertificateSamplesBeforeSaveAsync(newCert));

            Assert.Equal("SAMPLE_DUPLICATE_ACTIVE_CERTIFICATE", ex.Result.Code);
        }
    }
}
