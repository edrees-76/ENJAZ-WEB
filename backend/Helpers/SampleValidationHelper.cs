using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace backend.Helpers
{
    public static class SampleValidationHelper
    {
        private static readonly Regex ArabicDiacriticsRegex = new Regex(@"[\u064B-\u065F\u0670\u0640]", RegexOptions.Compiled);
        private static readonly Regex MultipleSpacesRegex = new Regex(@"\s+", RegexOptions.Compiled);
        private static readonly Regex HyphenSpacesRegex = new Regex(@"\s*-\s*", RegexOptions.Compiled);

        /// <summary>
        /// تطبيع أرقام العينات: إزالة الفراغات، والأصفار البادئة، والتعامل مع الصفر الخالص
        /// </summary>
        public static string NormalizeSampleNumber(string? sampleNumber)
        {
            if (string.IsNullOrWhiteSpace(sampleNumber))
                return string.Empty;

            string trimmed = sampleNumber.Trim();
            
            // تحويل الأرقام العربية/المشرقية إلى أرقام إنجليزية/عالمية إن وجدت
            trimmed = ConvertArabicNumeralsToLatin(trimmed);

            // إزالة الأصفار البادئة
            string stripped = trimmed.TrimStart('0');

            // إذا كان الرقم عبارة عن أصفار فقط (مثل "0" أو "000")
            if (stripped.Length == 0 && trimmed.Length > 0)
                return "0";

            return stripped;
        }

        /// <summary>
        /// تحويل الأرقام المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام لاتينية (0123456789)
        /// </summary>
        public static string ConvertArabicNumeralsToLatin(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;

            char[] chars = input.ToCharArray();
            for (int i = 0; i < chars.Length; i++)
            {
                if (chars[i] >= '\u0660' && chars[i] <= '\u0669')
                {
                    chars[i] = (char)('0' + (chars[i] - '\u0660'));
                }
                else if (chars[i] >= '\u06F0' && chars[i] <= '\u06F9')
                {
                    chars[i] = (char)('0' + (chars[i] - '\u06F0'));
                }
            }
            return new string(chars);
        }

        /// <summary>
        /// التطبيع اللغوي القياسي للنصوص العربية:
        /// توحيد أشكال الألف، التاء المربوطة، الياء والألف المقصورة، إزالة التشكيل والتطويل، وتوحيد المسافات
        /// </summary>
        public static string NormalizeArabicText(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            string normalized = text.Trim();

            // 1. إزالة التشكيل (الحركات) والتطويل (الكشيدة)
            normalized = ArabicDiacriticsRegex.Replace(normalized, "");

            // 2. توحيد أشكال الألف (أ، إ، آ، ٱ -> ا)
            normalized = normalized.Replace('أ', 'ا')
                                   .Replace('إ', 'ا')
                                   .Replace('آ', 'ا')
                                   .Replace('ٱ', 'ا');

            // 3. توحيد التاء المربوطة والهاء في نهاية الكلمات
            normalized = normalized.Replace('ة', 'ه');

            // 4. توحيد الياء والألف المقصورة (ى -> ي)
            normalized = normalized.Replace('ى', 'ي');

            // 5. توحيد الهمزات (ؤ -> و، ئ -> ي)
            normalized = normalized.Replace('ؤ', 'و')
                                   .Replace('ئ', 'ي');

            // 6. توحيد المسافات المتعددة وعلامات الجدولة إلى مسافة واحدة
            normalized = MultipleSpacesRegex.Replace(normalized, " ");

            // 7. توحيد المسافات حول الشرطات ( - )
            normalized = HyphenSpacesRegex.Replace(normalized, " - ");

            return normalized.Trim();
        }

        /// <summary>
        /// تطبيق قواعد أسماء الجهات وأخطاء الكتابة الشائعة (Business Aliases Layer)
        /// </summary>
        public static string ApplySenderAliases(string normalizedText)
        {
            if (string.IsNullOrWhiteSpace(normalizedText))
                return string.Empty;

            string result = normalizedText;

            // توحيد "ازواره" <-> "زواره"
            result = Regex.Replace(result, @"\bازواره\b", "زواره");

            // توحيد "و الادويه" <-> "والادويه"
            result = Regex.Replace(result, @"\bو\s+الادويه\b", "والادويه");
            result = Regex.Replace(result, @"\bو\s+الاغذيه\b", "والاغذيه");

            // توحيد المسافات مرة أخرى
            result = MultipleSpacesRegex.Replace(result, " ").Trim();

            return result;
        }

        /// <summary>
        /// التطبيع الكامل لاسم الجهة المرسلة (يدمج التطبيع اللغوي مع قواعد الأعمال)
        /// </summary>
        public static string NormalizeSender(string? sender)
        {
            if (string.IsNullOrWhiteSpace(sender))
                return string.Empty;

            string linguistic = NormalizeArabicText(sender);
            return ApplySenderAliases(linguistic);
        }

        /// <summary>
        /// فحص التكرار الداخلي لأرقام العينات داخل نفس الطلب (Intra-Payload Duplicate Check)
        /// يعيد أول رقم عينة مكرر إن وجد، أو null إذا كانت جميع العينات فريدة داخلياً
        /// </summary>
        public static (bool hasDuplicates, string? duplicateSampleNumber, List<string> duplicateList) CheckIntraPayloadDuplicates(IEnumerable<string?>? sampleNumbers)
        {
            if (sampleNumbers == null)
                return (false, null, new List<string>());

            var duplicates = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in sampleNumbers)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;

                string normalized = NormalizeSampleNumber(raw);
                if (string.IsNullOrEmpty(normalized)) continue;

                if (!seen.Add(normalized))
                {
                    duplicates.Add(raw.Trim());
                }
            }

            return (duplicates.Count > 0, duplicates.FirstOrDefault(), duplicates);
        }
    }
}
