using ClosedXML.Excel;
using backend.Models;

namespace backend.Services
{
    /// <summary>
    /// خدمة تصدير Excel باستخدام ClosedXML — مع دعم RTL والعربية
    /// مطابق لهيكلية تقرير PDF (ترويسة + جدول + إحصائيات + رسوم بيانية)
    /// </summary>
    public class ExcelExportService
    {
        /// <summary>
        /// توليد ملف Excel يحتوي على ورقتين: البيانات + الملخص والرسوم
        /// </summary>
        public byte[] GenerateExcel(
            List<CertificateReportRow> data,
            ReportSummaryDto summary,
            ReportRequest request)
        {
            using var workbook = new XLWorkbook();

            var title = request.ReportType == "sender" && !string.IsNullOrWhiteSpace(request.SenderName)
                ? $"تقرير الجهة: {request.SenderName}"
                : "تقرير شامل";

            // ═══════════════════════════════════════════════
            // Sheet 1: بيانات التقرير
            // ═══════════════════════════════════════════════
            var ws = workbook.Worksheets.Add("بيانات التقرير");
            ws.RightToLeft = true;

            // تحديد الأعمدة المطلوبة
            var columns = GetSelectedColumns(request.Columns);

            // === عنوان التقرير ===
            var titleCell = ws.Cell(1, 1);
            titleCell.Value = title;
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 16;
            titleCell.Style.Font.FontColor = XLColor.FromHtml("#1e3a5f");
            ws.Range(1, 1, 1, columns.Count + 1).Merge();
            titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // الفترة الزمنية + التاريخ
            ws.Cell(2, 1).Value = $"الفترة: {request.StartDate:yyyy/MM/dd} — {request.EndDate:yyyy/MM/dd}";
            ws.Cell(2, 1).Style.Font.FontSize = 10;
            ws.Cell(2, 1).Style.Font.FontColor = XLColor.DarkGray;
            ws.Range(2, 1, 2, columns.Count + 1).Merge();
            ws.Cell(2, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            if (!string.IsNullOrWhiteSpace(request.Sender))
            {
                ws.Cell(3, 1).Value = $"الجهة المرسلة: {request.Sender}";
                ws.Cell(3, 1).Style.Font.FontSize = 10;
                ws.Cell(3, 1).Style.Font.FontColor = XLColor.DarkGray;
                ws.Range(3, 1, 3, columns.Count + 1).Merge();
                ws.Cell(3, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            int headerRow = string.IsNullOrWhiteSpace(request.Sender) ? 4 : 5;

            // === Header Row (مع عمود التسلسل #) ===
            var seqHeader = ws.Cell(headerRow, 1);
            seqHeader.Value = "#";
            seqHeader.Style.Font.Bold = true;
            seqHeader.Style.Font.FontColor = XLColor.White;
            seqHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
            seqHeader.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            seqHeader.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

            for (int i = 0; i < columns.Count; i++)
            {
                var cell = ws.Cell(headerRow, i + 2);
                cell.Value = columns[i].Header;
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            // === Data Rows ===
            for (int row = 0; row < data.Count; row++)
            {
                // عمود التسلسل
                var seqCell = ws.Cell(headerRow + 1 + row, 1);
                seqCell.Value = row + 1;
                seqCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                seqCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (row % 2 == 1) seqCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f4f8");

                for (int col = 0; col < columns.Count; col++)
                {
                    var cell = ws.Cell(headerRow + 1 + row, col + 2);
                    cell.Value = columns[col].GetValue(data[row]);
                    cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // تلوين الصفوف بالتناوب
                    if (row % 2 == 1)
                    {
                        cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f4f8");
                    }
                }
            }

            // AutoFit
            ws.Columns().AdjustToContents();

            // ═══════════════════════════════════════════════
            // Sheet 2: ملخص الإحصائيات والرسوم البيانية
            // ═══════════════════════════════════════════════
            var summarySheet = workbook.Worksheets.Add("ملخص الإحصائيات");
            summarySheet.RightToLeft = true;

            // عنوان
            var sTitleCell = summarySheet.Cell(1, 1);
            sTitleCell.Value = title;
            sTitleCell.Style.Font.Bold = true;
            sTitleCell.Style.Font.FontSize = 16;
            sTitleCell.Style.Font.FontColor = XLColor.FromHtml("#1e3a5f");
            summarySheet.Range("A1:D1").Merge();
            sTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // الفترة الزمنية
            summarySheet.Cell(2, 1).Value = $"الفترة: {request.StartDate:yyyy/MM/dd} — {request.EndDate:yyyy/MM/dd}";
            summarySheet.Cell(2, 1).Style.Font.FontSize = 10;
            summarySheet.Cell(2, 1).Style.Font.FontColor = XLColor.DarkGray;
            summarySheet.Range("A2:D2").Merge();
            summarySheet.Cell(2, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // ─── الإحصائيات العامة ───
            int sRow = 4;
            AddSectionHeader(summarySheet, sRow, "الإحصائيات العامة", "#1e3a5f");
            sRow++;

            var stats = new (string Label, int Value)[]
            {
                ("إجمالي الشهادات", summary.TotalCertificates),
                ("إجمالي العينات", summary.TotalSamples),
                ("شهادات بيئية", summary.EnvironmentalCertificates),
                ("شهادات استهلاكية", summary.ConsumableCertificates),
                ("عينات بيئية", summary.EnvironmentalSamples),
                ("عينات استهلاكية", summary.ConsumableSamples)
            };

            foreach (var stat in stats)
            {
                var labelCell = summarySheet.Cell(sRow, 1);
                labelCell.Value = stat.Label;
                labelCell.Style.Font.Bold = true;
                labelCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#e8f0fe");
                labelCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                var valueCell = summarySheet.Cell(sRow, 2);
                valueCell.Value = stat.Value;
                valueCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                valueCell.Style.Font.Bold = true;
                valueCell.Style.Font.FontSize = 14;
                valueCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                sRow++;
            }

            // ─── الجهات الأكثر إرسالاً ───
            if (summary.TopSenders.Count > 0 && request.ReportType != "sender")
            {
                sRow += 2;
                AddSectionHeader(summarySheet, sRow, "الجهات الأكثر إرسالاً", "#4338ca");
                sRow++;
                sRow = AddChartDataTable(summarySheet, sRow, summary.TopSenders, "#e0e7ff", "#4338ca");
            }

            // ─── الموردون الأكثر توريداً ───
            if (summary.TopSuppliers.Count > 0)
            {
                sRow += 2;
                AddSectionHeader(summarySheet, sRow, "الموردون الأكثر توريداً", "#0d9488");
                sRow++;
                sRow = AddChartDataTable(summarySheet, sRow, summary.TopSuppliers, "#ccfbf1", "#0d9488");
            }

            // ─── أهم دول المنشأ ───
            if (summary.TopOrigins.Count > 0)
            {
                sRow += 2;
                AddSectionHeader(summarySheet, sRow, "أهم دول المنشأ", "#2563eb");
                sRow++;
                sRow = AddChartDataTable(summarySheet, sRow, summary.TopOrigins, "#dbeafe", "#2563eb");
            }

            // ─── نسب توزيع الشهادات والعينات ───
            sRow += 2;
            AddSectionHeader(summarySheet, sRow, "نسب توزيع الشهادات والعينات", "#ea580c");
            sRow++;
            var distData = new List<ReportChartDataPoint>
            {
                new() { Label = "شهادات بيئية", Value = summary.EnvironmentalCertificates },
                new() { Label = "شهادات استهلاكية", Value = summary.ConsumableCertificates },
                new() { Label = "عينات بيئية", Value = summary.EnvironmentalSamples },
                new() { Label = "عينات استهلاكية", Value = summary.ConsumableSamples }
            };
            sRow = AddChartDataTable(summarySheet, sRow, distData.Where(x => x.Value > 0).ToList(), "#fff7ed", "#ea580c");

            // ─── اتجاه الشهادات خلال الفترة ───
            if (summary.Timeline.Count > 0)
            {
                sRow += 2;
                AddSectionHeader(summarySheet, sRow, "اتجاه الشهادات خلال الفترة", "#7c3aed");
                sRow++;
                sRow = AddChartDataTable(summarySheet, sRow, summary.Timeline.TakeLast(7).ToList(), "#f5f3ff", "#7c3aed");
            }

            summarySheet.Columns().AdjustToContents();

            // حفظ في ذاكرة
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        /// <summary>
        /// إضافة عنوان قسم ملون
        /// </summary>
        private void AddSectionHeader(IXLWorksheet sheet, int row, string text, string color)
        {
            var cell = sheet.Cell(row, 1);
            cell.Value = text;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 12;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml(color);
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(row, 1, row, 4).Merge();
            sheet.Range(row, 1, row, 4).Style.Fill.BackgroundColor = XLColor.FromHtml(color);
            sheet.Range(row, 1, row, 4).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        /// <summary>
        /// إضافة جدول بيانات رسم بياني (اسم + قيمة + شريط مرئي)
        /// </summary>
        private int AddChartDataTable(IXLWorksheet sheet, int startRow, List<ReportChartDataPoint> data, string bgColor, string barColor)
        {
            // عناوين الأعمدة
            var hLabel = sheet.Cell(startRow, 1);
            hLabel.Value = "البيان";
            hLabel.Style.Font.Bold = true;
            hLabel.Style.Fill.BackgroundColor = XLColor.FromHtml("#f1f5f9");
            hLabel.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

            var hValue = sheet.Cell(startRow, 2);
            hValue.Value = "القيمة";
            hValue.Style.Font.Bold = true;
            hValue.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            hValue.Style.Fill.BackgroundColor = XLColor.FromHtml("#f1f5f9");
            hValue.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

            var hBar = sheet.Cell(startRow, 3);
            hBar.Value = "النسبة";
            hBar.Style.Font.Bold = true;
            hBar.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            hBar.Style.Fill.BackgroundColor = XLColor.FromHtml("#f1f5f9");
            hBar.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            sheet.Range(startRow, 3, startRow, 4).Merge();

            startRow++;

            var maxVal = data.Count > 0 ? data.Max(x => x.Value) : 1;
            if (maxVal == 0) maxVal = 1;

            foreach (var item in data)
            {
                // اسم البيان
                var labelCell = sheet.Cell(startRow, 1);
                labelCell.Value = item.Label;
                labelCell.Style.Fill.BackgroundColor = XLColor.FromHtml(bgColor);
                labelCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                // القيمة
                var valueCell = sheet.Cell(startRow, 2);
                valueCell.Value = item.Value;
                valueCell.Style.Font.Bold = true;
                valueCell.Style.Font.FontColor = XLColor.FromHtml(barColor);
                valueCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                valueCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                // شريط مرئي (نسبة مئوية)
                var pct = (double)item.Value / maxVal;
                var barCell = sheet.Cell(startRow, 3);
                // رسم شريط بصري باستخدام رموز ██
                var barLength = (int)(pct * 20);
                barCell.Value = new string('█', Math.Max(barLength, 1)) + $" {pct:P0}";
                barCell.Style.Font.FontColor = XLColor.FromHtml(barColor);
                barCell.Style.Font.Bold = true;
                barCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                barCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                sheet.Range(startRow, 3, startRow, 4).Merge();

                startRow++;
            }

            return startRow;
        }

        /// <summary>
        /// بناء قائمة أعمدة مختارة مع metadata
        /// </summary>
        private List<ColumnDef> GetSelectedColumns(List<ReportColumn> selected)
        {
            var allColumns = new Dictionary<ReportColumn, ColumnDef>
            {
                { ReportColumn.CertificateNumber, new("رقم الشهادة", r => r.CertificateNumber) },
                { ReportColumn.CertificateType, new("نوع الشهادة", r => r.CertificateType) },
                { ReportColumn.AnalysisType, new("نوع التحليل", r => r.AnalysisType ?? "") },
                { ReportColumn.Sender, new("الجهة المرسلة", r => r.Sender ?? "") },
                { ReportColumn.Supplier, new("المورد", r => r.Supplier ?? "") },
                { ReportColumn.Origin, new("بلد المنشأ", r => r.Origin ?? "") },
                { ReportColumn.NotificationNumber, new("رقم الإخطار", r => r.NotificationNumber ?? "") },
                { ReportColumn.DeclarationNumber, new("الإقرار الجمركي", r => r.DeclarationNumber ?? "") },
                { ReportColumn.FinancialReceiptNumber, new("الإيصال المالي", r => r.FinancialReceiptNumber ?? "") },
                { ReportColumn.SampleCount, new("عدد العينات", r => r.SampleCount.ToString()) },
                { ReportColumn.EnvSampleCount, new("عينات بيئية", r => r.EnvSampleCount.ToString()) },
                { ReportColumn.ConsSampleCount, new("عينات استهلاكية", r => r.ConsSampleCount.ToString()) },
                { ReportColumn.CreatedByName, new("المُنشئ", r => r.CreatedByName ?? "") },
                { ReportColumn.IssueDate, new("تاريخ الإصدار", r => r.IssueDate.ToString("yyyy/MM/dd")) }
            };

            // إذا لم يتم تحديد أعمدة، أرجع الكل
            if (selected == null || selected.Count == 0)
            {
                return allColumns.Values.ToList();
            }

            return selected
                .Where(s => allColumns.ContainsKey(s))
                .Select(s => allColumns[s])
                .ToList();
        }

        /// <summary>
        /// تعريف عمود (اسم + دالة استخراج القيمة)
        /// </summary>
        private record ColumnDef(string Header, Func<CertificateReportRow, string> GetValue);
    }
}
