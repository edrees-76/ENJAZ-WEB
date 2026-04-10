using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using backend.Models;

namespace backend.Services
{
    /// <summary>
    /// DTO for certificate data passed to the PDF generator.
    /// Uses projection to avoid loading full entity graphs.
    /// </summary>
    public class ReferralCertificateDto
    {
        public int Id { get; set; }
        public string CertificateNumber { get; set; } = string.Empty;
        public string? Supplier { get; set; }
        public string? NotificationNumber { get; set; }
        public int SampleCount { get; set; }
        public string SampleNumbers { get; set; } = string.Empty;
    }

    /// <summary>
    /// Service for generating referral letter PDFs using QuestPDF.
    /// Recreated to match the exact exact layout and text of the legacy Enjaz 2026 WPF application.
    /// </summary>
    public class ReferralPdfService
    {
        private const int CURRENT_TEMPLATE_VERSION = 2; // Version 2: Legacy Match

        public ReferralPdfService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public int CurrentTemplateVersion => CURRENT_TEMPLATE_VERSION;

        /// <summary>
        /// Generate a referral letter PDF and return it as a byte array.
        /// </summary>
        public byte[] GenerateReferralPdf(
            ReferralLetter letter,
            List<ReferralCertificateDto> certificates)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    // Standard margins
                    page.Margin(2.5f, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Arial"));
                    page.ContentFromRightToLeft();

                    // ═══════════════════════════════════════
                    // HEADER (Legacy Match)
                    // ═══════════════════════════════════════
                    page.Header().Element(header =>
                    {
                        header.Column(col =>
                        {
                            // Top row: text in center (logos would go left/right if images were loaded)
                            col.Item().Row(row =>
                            {
                                row.RelativeItem().AlignCenter().Column(c =>
                                {
                                    c.Item().Text("دولة ليبيا").FontSize(14).Bold().FontColor(Colors.Black);
                                    c.Item().Text("مؤسسة الطاقة الذرية").FontSize(14).Bold().FontColor(Colors.Black);
                                    c.Item().Text("مركز القياسات الإشعاعية والتدريب").FontSize(14).Bold().FontColor(Colors.Black);
                                });
                            });

                            // Date & Ref Number (Manual style)
                            col.Item().PaddingTop(20).Text($"التاريخ: {letter.GeneratedAt:yyyy/MM/dd}")
                                .FontSize(12).FontColor(Colors.Black);
                                
                            col.Item().PaddingTop(5).Text("رقم اشارى : .............................")
                                .FontSize(12).FontColor(Colors.Black);

                            col.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Black);
                        });
                    });

                    // ═══════════════════════════════════════
                    // CONTENT (Legacy Match)
                    // ═══════════════════════════════════════
                    page.Content().Element(content =>
                    {
                        content.PaddingVertical(20).Column(col =>
                        {
                            // Addressee
                            col.Item().PaddingBottom(10).Text($"السادة/ {letter.SenderName}")
                                .FontSize(14).Bold().FontColor(Colors.Black);

                            // Greeting
                            col.Item().PaddingBottom(15).Text("بعد التحية،،،")
                                .FontSize(13).Bold().FontColor(Colors.Black);

                            // Subject (Underlined, Bold)
                            col.Item().PaddingBottom(15).Text(text => 
                            {
                                text.Span("الموضوع : احالة شهادات تحليل اشعاعى لعينات")
                                    .FontSize(14).Bold().Underline().FontColor(Colors.Black);
                            });

                            // Body text exactly as legacy
                            col.Item().PaddingBottom(20).Text(
                                "نحيل إلى حضرتكم شهادات التحليل الإشعاعي الخاصة بالعينات الموضحة بياناتها بالجدول المرفق، وذلك لغرض الاستلام والاطلاع واتخاذ ما يلزم حيالها وفق الإجراءات المعمول بها.")
                                .FontSize(13).LineHeight(1.5f).FontColor(Colors.Black);

                            // ═══ Dynamic Table (Legacy style columns) ═══
                            if (certificates.Count > 0)
                            {
                                col.Item().PaddingTop(10).Table(table =>
                                {
                                    var columns = GetActiveColumns(letter.IncludedColumns);

                                    // Define columns
                                    table.ColumnsDefinition(colDef =>
                                    {
                                        colDef.ConstantColumn(35); // "#" Column
                                        foreach (var c in columns)
                                            colDef.RelativeColumn(c.Width);
                                    });

                                    // Header row
                                    AddHeaderCell(table, "م");
                                    foreach (var c in columns)
                                        AddHeaderCell(table, c.Header);

                                    // Data rows
                                    for (int i = 0; i < certificates.Count; i++)
                                    {
                                        var cert = certificates[i];
                                        var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                                        AddDataCell(table, (i + 1).ToString(), bg);
                                        foreach (var c in columns)
                                            AddDataCell(table, c.GetValue(cert), bg);
                                    }
                                });
                            }

                            // Signature area (Recipient only on the left side)
                            col.Item().PaddingTop(50).Row(row =>
                            {
                                row.RelativeItem(); // push to the left 
                                row.RelativeItem().AlignLeft().Column(c =>
                                {
                                    c.Item().PaddingBottom(15).Text("اسم المستلم: .........................")
                                        .FontSize(12).FontColor(Colors.Black);
                                    c.Item().Text("الـــتوقـــيع: ..........................")
                                        .FontSize(12).FontColor(Colors.Black);
                                });
                            });
                        });
                    });

                    // ═══════════════════════════════════════
                    // FOOTER (Legacy Match)
                    // ═══════════════════════════════════════
                    page.Footer().PaddingBottom(10).AlignCenter().Text("طرابلس - خلة الفرجان - 8 كم طريق قصر بن غشير info@crmt.ly WWW.CRMT.LY +218921151020")
                        .FontSize(9).FontColor(Colors.Black);
                });
            });

            using var ms = new MemoryStream();
            document.GeneratePdf(ms);
            return ms.ToArray();
        }

        // ═══════════════════════════════════════
        // Column Configuration
        // ═══════════════════════════════════════

        private List<ReferralColumnDef> GetActiveColumns(ReferralColumns flags)
        {
            var result = new List<ReferralColumnDef>();

            if (flags.HasFlag(ReferralColumns.CertificateNumber))
                result.Add(new("رقم الشهادة", c => c.CertificateNumber, 2f));

            if (flags.HasFlag(ReferralColumns.Supplier))
                result.Add(new("اسم المورد", c => c.Supplier ?? "—", 2f)); // Updated to match legacy header

            if (flags.HasFlag(ReferralColumns.Samples))
                result.Add(new("أرقام العينات", c => c.SampleNumbers, 2.5f));

            if (flags.HasFlag(ReferralColumns.NotificationNumber))
                result.Add(new("رقم الإخطار", c => c.NotificationNumber ?? "—", 1.5f));

            // Fallback: if no columns selected, show certificate number
            if (result.Count == 0)
                result.Add(new("رقم الشهادة", c => c.CertificateNumber, 2f));

            return result;
        }

        private void AddHeaderCell(TableDescriptor table, string text)
        {
            table.Cell().Background(Colors.Grey.Lighten2)
                .Border(1).BorderColor(Colors.Black)
                .PaddingVertical(6).PaddingHorizontal(2).AlignCenter()
                .Text(text).FontSize(11).Bold().FontColor(Colors.Black);
        }

        private void AddDataCell(TableDescriptor table, string text, string bgColor)
        {
            table.Cell().Background(bgColor)
                .Border(1).BorderColor(Colors.Black)
                .PaddingVertical(5).PaddingHorizontal(2).AlignCenter()
                .Text(text ?? "").FontSize(11).FontColor(Colors.Black);
        }

        private record ReferralColumnDef(
            string Header,
            Func<ReferralCertificateDto, string> GetValue,
            float Width);
    }
}
