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
            // Resolve asset paths
            var assetsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "frontend", "public", "assets");
            var libyaLogoPath = Path.Combine(assetsPath, "logo_libya.png");
            var centerLogoPath = Path.Combine(assetsPath, "logo_center.png");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    // Standard margin so content avoids the 8pt outer border; matching certificate padding
                    page.Margin(25, Unit.Point);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial").FontColor(Colors.Black));
                    page.ContentFromRightToLeft();

                    // ═══════════════════════════════════════
                    // BACKGROUND (Border 1pt)
                    // ═══════════════════════════════════════
                    page.Background()
                        .Padding(8, Unit.Point)
                        .Border(1)
                        .BorderColor(Colors.Black)
                        .Text(""); // Valid safe empty child

                    // ═══════════════════════════════════════
                    // HEADER & CONTENT
                    // ═══════════════════════════════════════
                    page.Content().PaddingTop(15).PaddingHorizontal(18).Column(col =>
                    {
                        // HEADER SECTION (Matches Certificate exactly)
                        col.Item().Row(row =>
                        {
                            // Right side in RTL (Center Logo) - Increasted 30%
                            if (File.Exists(centerLogoPath))
                                row.ConstantItem(115).Height(115).AlignCenter().AlignMiddle()
                                   .Container().MaxHeight(115).MaxWidth(115).Image(centerLogoPath);
                            else
                                row.ConstantItem(115);

                            // Center Text (18pt bold)
                            row.RelativeItem().AlignCenter().AlignMiddle().Column(c =>
                            {
                                c.Spacing(6, Unit.Point);
                                c.Item().AlignCenter().Text("دولة ليبيا").FontSize(18).Bold().FontColor(Colors.Black);
                                c.Item().AlignCenter().Text("مؤسسة الطاقة الذرية").FontSize(18).Bold().FontColor(Colors.Black);
                                c.Item().AlignCenter().Text("مركز القياسات الإشعاعية والتدريب").FontSize(18).Bold().FontColor(Colors.Black);
                            });

                            // Left side in RTL (Coat of Arms)
                            // Outer bounds remain 115 to preserve mathematical center, but visual element stays smaller (85)
                            if (File.Exists(libyaLogoPath))
                                row.ConstantItem(115).Height(115).AlignCenter().AlignMiddle()
                                   .Container().MaxHeight(85).MaxWidth(85).Image(libyaLogoPath);
                            else
                                row.ConstantItem(115);
                        });

                        // Meta Data (Date / Ref)
                        col.Item().PaddingTop(20).PaddingBottom(20).Row(row =>
                        {
                            row.RelativeItem(); // push to the left 
                            row.ConstantItem(160).Column(c =>
                            {
                                c.Item().Text($"التاريخ: {letter.GeneratedAt:yyyy/MM/dd}").FontSize(11).FontColor(Colors.Black);
                                c.Item().Text("رقم إشارى : .........................").FontSize(11).FontColor(Colors.Black);
                            });
                        });

                        // BODY CONTENT
                        // Addressee
                        col.Item().PaddingBottom(8).Text($"السادة/ {letter.SenderName}")
                            .FontSize(13).Bold().FontColor(Colors.Black);

                        // Greeting
                        col.Item().PaddingBottom(12).Text("بعد التحية،،،")
                            .FontSize(12).Bold().FontColor(Colors.Black);

                        // Subject
                        col.Item().AlignCenter().PaddingBottom(18).Text(text => 
                        {
                            text.Span("الموضوع : إحالة شهادات تحليل إشعاعي لعينات")
                                .FontSize(13).Bold().FontColor(Colors.Black).Underline();
                        });

                        // Body text
                        col.Item().PaddingBottom(20).Text(
                            "نحيل إلى حضرتكم شهادات التحليل الإشعاعي الخاصة بالعينات الموضحة بياناتها بالجدول المرفق، وذلك لغرض الاستلام والاطلاع واتخاذ ما يلزم حيالها وفق الإجراءات المعمول بها.")
                            .FontSize(12).LineHeight(1.5f).FontColor(Colors.Black).Justify();

                        // ═══ Dynamic Table ═══
                        if (certificates.Count > 0)
                        {
                            col.Item().Table(table =>
                            {
                                var columns = GetActiveColumns(letter.IncludedColumns);

                                table.ColumnsDefinition(colDef =>
                                {
                                    colDef.ConstantColumn(30); // "#" Column
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
                                    AddDataCell(table, (i + 1).ToString());
                                    foreach (var c in columns)
                                        AddDataCell(table, c.GetValue(cert));
                                }
                            });
                        }

                        // Signature area
                        col.Item().PaddingTop(50).Row(row =>
                        {
                            row.RelativeItem(); // push to the left 
                            row.ConstantItem(250).Column(c =>
                            {
                                c.Item().PaddingBottom(10).Text("اسم المستلم: .......................................")
                                    .FontSize(11).FontColor(Colors.Black);
                                c.Item().Text("الـــتوقـــيع: ........................................")
                                    .FontSize(11).FontColor(Colors.Black);
                            });
                        });
                    });

                    // ═══════════════════════════════════════
                    // FOOTER (Official Design - No line)
                    // ═══════════════════════════════════════
                    page.Footer().PaddingBottom(10).AlignCenter().Text(text =>
                    {
                        text.Span("طرابلس - خلة الفرجان - 8 كم طريق قصر بن غشير").FontSize(9);
                        text.Span(" | ").FontSize(9).Bold();
                        text.Span("+218921151020").FontSize(9);
                        text.Span(" | ").FontSize(9).Bold();
                        text.Span("WWW.CRMT.LY").FontSize(9);
                        text.Span(" | ").FontSize(9).Bold();
                        text.Span("info@crmt.ly").FontSize(9);
                    });
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
            table.Cell().Background(Colors.Grey.Lighten3)
                .Border(0.5f).BorderColor(Colors.Black)
                .PaddingVertical(5).PaddingHorizontal(2).AlignCenter()
                .Text(text).FontSize(10).Bold().FontColor(Colors.Black);
        }

        private void AddDataCell(TableDescriptor table, string text)
        {
            table.Cell().Background(Colors.White)
                .Border(0.5f).BorderColor(Colors.Black)
                .PaddingVertical(4).PaddingHorizontal(2).AlignCenter()
                .Text(text ?? "").FontSize(10).FontColor(Colors.Black);
        }

        private record ReferralColumnDef(
            string Header,
            Func<ReferralCertificateDto, string> GetValue,
            float Width);
    }
}
