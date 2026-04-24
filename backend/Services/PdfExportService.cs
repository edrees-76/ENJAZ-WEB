using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using backend.Models;

namespace backend.Services
{
    /// <summary>
    /// خدمة تصدير PDF باستخدام QuestPDF — مع دعم كامل للعربية (RTL)
    /// </summary>
    public class PdfExportService
    {
        public PdfExportService()
        {
            // QuestPDF Community License
            QuestPDF.Settings.License = LicenseType.Community;
        }

        /// <summary>
        /// توليد ملف PDF يحتوي على: ترويسة + جدول بيانات + ملخص إحصائي
        /// </summary>
        public byte[] GeneratePdf(
            List<CertificateReportRow> data,
            ReportSummaryDto summary,
            ReportRequest request)
        {
            // حد أقصى 500 صف في PDF
            var limitedData = data.Take(500).ToList();

            var title = request.ReportType == "sender" && !string.IsNullOrWhiteSpace(request.SenderName)
                ? $"تقرير الجهة: {request.SenderName}"
                : "تقرير شامل";

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1.5f, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));
                    page.ContentFromRightToLeft();

                    // === Header ===
                    page.Header().Element(header =>
                    {
                        header.Column(col =>
                        {
                            col.Item().Row(row =>
                            {
                                row.RelativeItem().AlignRight().Text(title)
                                    .FontSize(16).Bold().FontColor(Colors.Blue.Darken3);

                                row.RelativeItem().AlignLeft().Text($"التاريخ: {DateTime.Now:yyyy/MM/dd}")
                                    .FontSize(9).FontColor(Colors.Grey.Darken1);
                            });

                            col.Item().PaddingTop(5).Row(row =>
                            {
                                row.RelativeItem().AlignRight().Text(
                                    $"الفترة: {request.StartDate:yyyy/MM/dd} — {request.EndDate:yyyy/MM/dd}")
                                    .FontSize(9).FontColor(Colors.Grey.Darken2);

                                if (!string.IsNullOrWhiteSpace(request.Sender))
                                {
                                    row.RelativeItem().AlignLeft().Text($"الجهة: {request.Sender}")
                                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                                }
                            });

                            col.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Blue.Darken3);
                        });
                    });

                    // === Content ===
                    page.Content().Element(content =>
                    {
                        content.PaddingVertical(10).Column(col =>
                        {
                            // ─── ملخص الإحصائيات ───
                            col.Item().PaddingBottom(10).Row(row =>
                            {
                                AddStatBox(row, "إجمالي الشهادات", summary.TotalCertificates, Colors.Blue.Darken2);
                                AddStatBox(row, "إجمالي العينات", summary.TotalSamples, Colors.Indigo.Darken1);
                                AddStatBox(row, "شهادات بيئية", summary.EnvironmentalCertificates, Colors.Green.Darken1);
                                AddStatBox(row, "شهادات استهلاكية", summary.ConsumableCertificates, Colors.Orange.Darken1);
                                AddStatBox(row, "عينات بيئية", summary.EnvironmentalSamples, Colors.Teal.Darken1);
                                AddStatBox(row, "عينات استهلاكية", summary.ConsumableSamples, Colors.Cyan.Darken1);
                            });

                            // ─── جدول البيانات ───
                            if (limitedData.Count > 0)
                            {
                                col.Item().Table(table =>
                                {
                                    var pdfColumns = GetSelectedColumns(request.Columns);

                                    // تعريف الأعمدة
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.ConstantColumn(20); // التسلسل
                                        foreach (var colDef in pdfColumns)
                                        {
                                            columns.RelativeColumn(colDef.Width);
                                        }
                                    });

                                    // Header
                                    table.Cell().Background(Colors.Blue.Darken3).Padding(4).AlignCenter().Text("#").FontSize(8).Bold().FontColor(Colors.White);
                                    foreach (var colDef in pdfColumns)
                                    {
                                        table.Cell().Background(Colors.Blue.Darken3)
                                            .Padding(4).AlignCenter()
                                            .Text(colDef.Header).FontSize(8).Bold().FontColor(Colors.White);
                                    }

                                    // Data Rows
                                    for (int i = 0; i < limitedData.Count; i++)
                                    {
                                        var d = limitedData[i];
                                        var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                                        // التسلسل
                                        AddTableCell(table, (i + 1).ToString(), bg);

                                        foreach (var colDef in pdfColumns)
                                        {
                                            AddTableCell(table, colDef.GetValue(d), bg);
                                        }
                                    }
                                });
                            }
                            else
                            {
                                col.Item().PaddingTop(30).AlignCenter()
                                    .Text("لا توجد بيانات في هذه الفترة الزمنية")
                                    .FontSize(14).FontColor(Colors.Grey.Medium);
                            }

                            // عدد السجلات
                            if (data.Count > 500)
                            {
                                col.Item().PaddingTop(5).AlignCenter()
                                    .Text($"* تم عرض أول 500 سجل من أصل {data.Count} سجل")
                                    .FontSize(8).FontColor(Colors.Red.Medium);
                            }

                            // ─── المخططات المبسطة ───
                            var showSenders = summary.TopSenders.Count > 0 && request.ReportType != "sender";
                            var showSuppliers = summary.TopSuppliers.Count > 0;
                            if (showSenders || showSuppliers)
                            {
                                col.Item().PaddingTop(15).PaddingBottom(10).Row(row =>
                                {
                                    if (showSenders)
                                    {
                                        row.RelativeItem().PaddingRight(10).Column(c =>
                                        {
                                            c.Item().PaddingBottom(5).Text("الجهات الأكثر إرسالاً").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                                            AddLightBarChart(c, summary.TopSenders.Take(4).ToList(), Colors.Indigo.Lighten1);
                                        });
                                    }
                                    if (showSuppliers)
                                    {
                                        row.RelativeItem().PaddingRight(10).Column(c =>
                                        {
                                            c.Item().PaddingBottom(5).Text("الموردون الأكثر توريداً").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                                            AddLightBarChart(c, summary.TopSuppliers.Take(4).ToList(), Colors.Teal.Lighten1);
                                        });
                                    }
                                });
                            }

                            // ─── المخططات الإضافية (دول المنشأ والتوزيع) ───
                            col.Item().PaddingTop(5).PaddingBottom(10).Row(row =>
                            {
                                if (summary.TopOrigins.Count > 0)
                                {
                                    row.RelativeItem().PaddingRight(10).Column(c =>
                                    {
                                        c.Item().PaddingBottom(5).Text("أهم دول المنشأ").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                                        AddLightBarChart(c, summary.TopOrigins.Take(4).ToList(), Colors.Blue.Lighten1);
                                    });
                                }
                                
                                row.RelativeItem().PaddingRight(10).Column(c =>
                                {
                                    c.Item().PaddingBottom(5).Text("نسب توزيع الشهادات والعينات").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                                    var distData = new List<ReportChartDataPoint>
                                    {
                                        new() { Label = "شهادات بيئية", Value = summary.EnvironmentalCertificates },
                                        new() { Label = "شهادات استهلاكية", Value = summary.ConsumableCertificates },
                                        new() { Label = "عينات بيئية", Value = summary.EnvironmentalSamples },
                                        new() { Label = "عينات استهلاكية", Value = summary.ConsumableSamples }
                                    };
                                    AddLightBarChart(c, distData.Where(x => x.Value > 0).ToList(), Colors.Orange.Lighten1);
                                });
                            });

                            // ─── المخطط الزمني ───
                            if (summary.Timeline.Count > 0)
                            {
                                col.Item().PaddingTop(5).PaddingBottom(10).Column(c =>
                                {
                                    c.Item().PaddingBottom(5).Text("اتجاه الشهادات خلال الفترة").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                                    AddLightBarChart(c, summary.Timeline.TakeLast(7).ToList(), Colors.Purple.Lighten1);
                                });
                            }
                        });
                    });

                    // === Footer ===
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium));
                        text.Span("صفحة ");
                        text.CurrentPageNumber();
                        text.Span(" من ");
                        text.TotalPages();
                    });
                });
            });

            using var ms = new MemoryStream();
            document.GeneratePdf(ms);
            return ms.ToArray();
        }

        private void AddStatBox(RowDescriptor row, string label, int value, string color)
        {
            row.RelativeItem().Padding(3).Border(1).BorderColor(Colors.Grey.Lighten2)
                .Background(Colors.Grey.Lighten5).Padding(6).Column(col =>
                {
                    col.Item().AlignCenter().Text(label).FontSize(7).FontColor(Colors.Grey.Darken2);
                    col.Item().AlignCenter().Text(value.ToString())
                        .FontSize(14).Bold().FontColor(color);
                });
        }

        private void AddTableCell(TableDescriptor table, string text, string bgColor)
        {
            table.Cell().Background(bgColor).Border(0.5f).BorderColor(Colors.Grey.Lighten2)
                .Padding(3).AlignCenter()
                .Text(text ?? "").FontSize(8);
        }

        private void AddLightBarChart(ColumnDescriptor col, List<ReportChartDataPoint> data, string color)
        {
            var maxVal = data.Max(x => x.Value);
            if (maxVal == 0) maxVal = 1;

            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(3); c.ConstantColumn(20); });
                foreach (var s in data)
                {
                    t.Cell().PaddingRight(5).AlignMiddle().Text(s.Label).FontSize(7).FontColor(Colors.Grey.Darken2);
                    t.Cell().AlignMiddle().Row(r =>
                    {
                        if (s.Value > 0) r.RelativeItem((float)s.Value).Background(color).Height(6);
                        var diff = maxVal - s.Value;
                        if (diff > 0) r.RelativeItem((float)diff).Background(Colors.Transparent).Height(6);
                    });
                    t.Cell().PaddingLeft(5).AlignMiddle().AlignCenter().Text(s.Value.ToString()).FontSize(7).Bold().FontColor(Colors.Grey.Darken2);
                }
            });
        }

        private List<ColumnDef> GetSelectedColumns(List<ReportColumn> selected)
        {
            var allColumns = new Dictionary<ReportColumn, ColumnDef>
            {
                { ReportColumn.CertificateNumber, new("رقم الشهادة", r => r.CertificateNumber, 2f) },
                { ReportColumn.CertificateType, new("نوع الشهادة", r => r.CertificateType, 1.5f) },
                { ReportColumn.AnalysisType, new("نوع التحليل", r => r.AnalysisType ?? "", 1.5f) },
                { ReportColumn.Sender, new("الجهة المرسلة", r => r.Sender ?? "", 2f) },
                { ReportColumn.Supplier, new("المورد", r => r.Supplier ?? "", 2f) },
                { ReportColumn.Origin, new("بلد المنشأ", r => r.Origin ?? "", 1.5f) },
                { ReportColumn.NotificationNumber, new("رقم الإخطار", r => r.NotificationNumber ?? "", 1.5f) },
                { ReportColumn.DeclarationNumber, new("الإقرار الجمركي", r => r.DeclarationNumber ?? "", 1.5f) },
                { ReportColumn.FinancialReceiptNumber, new("الإيصال", r => r.FinancialReceiptNumber ?? "", 1.5f) },
                { ReportColumn.SampleCount, new("العينات", r => r.SampleCount.ToString(), 1f) },
                { ReportColumn.EnvSampleCount, new("ع. بيئي", r => r.EnvSampleCount.ToString(), 1f) },
                { ReportColumn.ConsSampleCount, new("ع. استهلاك", r => r.ConsSampleCount.ToString(), 1f) },
                { ReportColumn.CreatedByName, new("المُنشئ", r => r.CreatedByName ?? "", 1.5f) },
                { ReportColumn.IssueDate, new("تاريخ الإصدار", r => r.IssueDate.ToString("yy/MM/dd"), 1.2f) }
            };

            if (selected == null || selected.Count == 0)
            {
                return new List<ColumnDef> { 
                    allColumns[ReportColumn.CertificateNumber],
                    allColumns[ReportColumn.CertificateType],
                    allColumns[ReportColumn.Sender],
                    allColumns[ReportColumn.Supplier],
                    allColumns[ReportColumn.Origin],
                    allColumns[ReportColumn.SampleCount],
                    allColumns[ReportColumn.IssueDate]
                };
            }

            return selected
                .Where(s => allColumns.ContainsKey(s))
                .Select(s => allColumns[s])
                .ToList();
        }

        private record ColumnDef(string Header, Func<CertificateReportRow, string> GetValue, float Width);
    }
}
