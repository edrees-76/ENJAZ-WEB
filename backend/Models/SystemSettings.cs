using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// إعدادات النظام العامة — صف واحد في قاعدة البيانات
    /// </summary>
    public class SystemSettings
    {
        public int Id { get; set; }

        /// <summary>تفعيل جرس التنبيهات (عينات مر عليها أيام بدون شهادة)</summary>
        public bool EnableAlerts { get; set; } = true;

        /// <summary>عدد الأيام قبل إطلاق التنبيه (الافتراضي 7)</summary>
        public int AlertThresholdDays { get; set; } = 7;

        /// <summary>تفعيل النسخ الاحتياطي التلقائي</summary>
        public bool AutoBackupEnabled { get; set; } = false;

        /// <summary>تكرار النسخ التلقائي: daily / weekly / monthly</summary>
        [MaxLength(20)]
        public string BackupFrequency { get; set; } = "daily";

        /// <summary>تاريخ آخر نسخة احتياطية</summary>
        public DateTime? LastBackupDate { get; set; }

        /// <summary>هل المنظومة في وضع الصيانة (أثناء الاستعادة)</summary>
        public bool MaintenanceMode { get; set; } = false;

        /// <summary>تاريخ آخر تحديث للإعدادات</summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
