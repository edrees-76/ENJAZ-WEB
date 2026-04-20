using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface ICertificateService
    {
        Task<Certificate> CreateCertificateAsync(Certificate certificate);
    }

    public class CertificateService : ICertificateService
    {
        private readonly EnjazDbContext _context;
        private readonly IAlertService _alertService;

        public CertificateService(EnjazDbContext context, IAlertService alertService)
        {
            _context = context;
            _alertService = alertService;
        }

        public async Task<Certificate> CreateCertificateAsync(Certificate certificate)
        {
            // Check for FinancialReceiptNumber uniqueness
            if (!string.IsNullOrEmpty(certificate.FinancialReceiptNumber))
            {
                var exists = await _context.Certificates.AnyAsync(c => c.FinancialReceiptNumber == certificate.FinancialReceiptNumber);
                if (exists)
                {
                    throw new InvalidOperationException($"رقم الإيصال المالي ({certificate.FinancialReceiptNumber}) مستخدم بالفعل في شهادة أخرى.");
                }
            }

            // Execute within a transaction with an exclusive lock on the Certificates table (or serializable level)
            // to ensure no other request gets the same sequence number.
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            
            try
            {
                bool isEnvironmental = certificate.CertificateType != null && certificate.CertificateType.Contains("بيئية");
                string typeCode = isEnvironmental ? "E" : "C";
                string year = certificate.IssueDate.ToString("yy");

                string patternE = $"RM-E-{year}-%";
                string patternC = $"RM-C-{year}-%";
                string patternU = $"RM-{year}-%";

                // Get the latest certificate matching the patterns directly using EF Core
                var latestCert = await _context.Certificates
                    .Where(c => EF.Functions.Like(c.CertificateNumber, patternE) ||
                                EF.Functions.Like(c.CertificateNumber, patternC) ||
                                EF.Functions.Like(c.CertificateNumber, patternU))
                    .OrderByDescending(c => c.Id)
                    .FirstOrDefaultAsync();

                int nextSequence = 1;
                
                if (latestCert != null && !string.IsNullOrEmpty(latestCert.CertificateNumber))
                {
                    var parts = latestCert.CertificateNumber.Split('-');
                    if (parts.Length >= 3 && int.TryParse(parts[parts.Length - 1], out int lastSeq))
                    {
                        nextSequence = lastSeq + 1;
                    }
                }

                certificate.CertificateNumber = $"RM-{typeCode}-{year}-{nextSequence:D4}";

                _context.Certificates.Add(certificate);

                if (certificate.SampleReceptionId.HasValue)
                {
                    var reception = await _context.SampleReceptions.FindAsync(certificate.SampleReceptionId.Value);
                    if (reception != null)
                    {
                        reception.Status = "تم إصدار شهادة";
                        
                        // Sync key fields from certificate back to sample reception
                        if (!string.IsNullOrEmpty(certificate.FinancialReceiptNumber))
                            reception.FinancialReceiptNumber = certificate.FinancialReceiptNumber;
                        if (!string.IsNullOrEmpty(certificate.PolicyNumber))
                            reception.PolicyNumber = certificate.PolicyNumber;
                        if (!string.IsNullOrEmpty(certificate.DeclarationNumber))
                            reception.DeclarationNumber = certificate.DeclarationNumber;
                        if (!string.IsNullOrEmpty(certificate.NotificationNumber))
                            reception.NotificationNumber = certificate.NotificationNumber;
                        
                        reception.UpdatedAt = DateTime.UtcNow;
                        _context.SampleReceptions.Update(reception);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // M6: حل التنبيه بعد نجاح المعاملة — يمنع حالة split-brain
                // (تنبيه محلول + شهادة لم تُنشأ إذا فشل الـ Commit)
                if (certificate.SampleReceptionId.HasValue)
                {
                    await _alertService.ResolveAlertsForSampleAsync(certificate.SampleReceptionId.Value);
                }

                return certificate;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
