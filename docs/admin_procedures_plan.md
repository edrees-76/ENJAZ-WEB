# خطة تطوير قسم الإجراءات الإدارية (Administrative Procedures) — v2.0

بناءً على التحليل الشامل للمنظومة القديمة (WPF) + المراجعة المعمارية الحرجة.

---

## هدف القسم

إنشاء وإدارة **رسائل الإحالة الرسمية** التي تغطي مجموعة من الشهادات الصادرة لجهة معينة خلال فترة زمنية محددة، مع أرشفة كاملة وإمكانية إعادة الطباعة.

---

## Proposed Changes

### المرحلة 1: البنية التحتية (Backend — Data Layer)

---

#### [NEW] ReferralLetter.cs

```csharp
[Flags]
public enum ReferralColumns
{
    CertificateNumber = 1,
    Supplier = 2,
    Samples = 4,
    NotificationNumber = 8
}
```

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `Id` | int (PK) | المعرف التلقائي |
| `ReferenceNumber` | string | رقم مرجعي رسمي `REF-2026-000123` |
| `GeneratedAt` | DateTime | تاريخ ووقت الإنشاء |
| `SenderName` | string | الجهة المرسل لها الخطاب |
| `CertificateCount` | int | عدد الشهادات المشمولة |
| `SampleCount` | int | إجمالي العينات المرتبطة |
| `StartDate` | DateTime | بداية الفترة الزمنية |
| `EndDate` | DateTime | نهاية الفترة الزمنية |
| `IncludedColumns` | int (Enum Bitmask) | الأعمدة المختارة (Type-safe) |
| `PdfPath` | string? | مسار ملف PDF المحفوظ |
| `TemplateVersion` | int | إصدار قالب PDF المستخدم (افتراضي = 1) |
| `CreatedByName` | string? | اسم المستخدم الذي أنشأ الرسالة |
| `IsDeleted` | bool | حذف ناعم (Soft Delete) |

---

#### [NEW] ReferralLetterCertificate.cs
جدول ربط (Junction Table) لتخزين **Snapshot** الشهادات المرتبطة بكل رسالة:

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `Id` | int (PK) | المعرف |
| `ReferralLetterId` | int (FK) | مرجع الرسالة |
| `CertificateId` | int (FK) | مرجع الشهادة |

> **الهدف:** عند إعادة توليد PDF لاحقاً، نستعلم من هذا الجدول وليس بالبحث مجدداً. هذا يمنع أي تغيير في المحتوى حتى لو تم تعديل الشهادة الأصلية.

---

#### [MODIFY] EnjazDbContext.cs

```diff
+ public DbSet<ReferralLetter> ReferralLetters { get; set; }
+ public DbSet<ReferralLetterCertificate> ReferralLetterCertificates { get; set; }
```

إضافات في `OnModelCreating`:
- علاقة `ReferralLetter` → `ReferralLetterCertificate` (One-to-Many, Cascade)
- علاقة `ReferralLetterCertificate` → `Certificate` (Many-to-One, Restrict)
- فهرس على `SenderName` و `GeneratedAt`
- فلتر استعلام عام `IsDeleted == false`

---

#### [NEW] Migration

```bash
dotnet ef migrations add AddReferralLetters
dotnet ef database update
```

---

### المرحلة 2: واجهة API (Backend — Controller Layer)

---

#### [NEW] AdminProceduresController.cs

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/admin-procedures/senders` | جلب قائمة الجهات (مع Caching لأنها ثابتة نسبياً) |
| `POST` | `/api/admin-procedures/preview` | معاينة: DTO مع Pagination + Projection (بدون Lazy Loading) |
| `POST` | `/api/admin-procedures/generate` | إنشاء السجل + ربط الشهادات + توليد PDF + حفظ المسار |
| `GET` | `/api/admin-procedures/history` | جلب سجل الرسائل (Pagination + فلتر Sender + Soft Delete) |
| `GET` | `/api/admin-procedures/{id}/pdf` | تحميل PDF المحفوظ (أو إعادة توليده من Snapshot إن فُقد) |
| `DELETE` | `/api/admin-procedures/{id}` | حذف ناعم (Soft Delete) |

**تفاصيل endpoint الـ Generate:**

```
POST /api/admin-procedures/generate
Body: {
    senderName: string,
    startDate: date,
    endDate: date,
    includedColumns: number (bitmask)
}

Response Flow:
1. استعلام الشهادات المطابقة (Projection → DTO)
2. إنشاء سجل ReferralLetter مع ReferenceNumber تلقائي
3. حفظ ربط الشهادات في ReferralLetterCertificates (Snapshot)
4. توليد PDF من الـ Snapshot وحفظه في مجلد ثابت
5. تسجيل العملية في Audit Log
6. إرجاع الملف كـ FileResult
```

---

### المرحلة 3: محرك توليد PDF (Backend — Service Layer)

---

#### [NEW] ReferralPdfService.cs

مكتبة: **QuestPDF** (مفتوحة المصدر، دعم RTL ممتاز)

```bash
dotnet add package QuestPDF
```

**هيكل الرسالة:**

```
┌─────────────────────────────────┐
│  🏛️ شعار المؤسسة + العنوان      │  ← Header
│  📅 التاريخ | 📋 REF-2026-00012 │
├─────────────────────────────────┤
│  إلى / الجهة المرسل لها          │  ← Body
│  الموضوع: إحالة شهادات          │
│                                 │
│  ┌───┬────────┬───────┬──────┐  │
│  │ # │ الشهادة │ المورد │ ...  │  │  ← جدول ديناميكي
│  ├───┼────────┼───────┼──────┤  │     (فقط الأعمدة المختارة)
│  │ 1 │ C-0045 │ شركة  │ ...  │  │
│  └───┴────────┴───────┴──────┘  │
│                                 │
│  المجموع: 12 شهادة | 45 عينة   │
├─────────────────────────────────┤
│  📝 التوقيع والختم               │  ← Footer
│  صفحة 1 من 3                    │
└─────────────────────────────────┘
```

- قالب **مستقل تماماً** عن قالب الشهادات
- `TemplateVersion = 1` (محفوظ مع كل رسالة)
- دعم كامل للعربية RTL
- Pagination تلقائية للجداول الطويلة

---

### المرحلة 4: واجهة المستخدم (Frontend)

---

#### [NEW] AdminProcedures.tsx

**التبويب 1: معالج إنشاء رسالة الإحالة (3-Step Wizard)**

```
  ╔═══════════╗    ╔═══════════╗    ╔═══════════╗
  ║  1️⃣ النطاق ║ →→ ║  2️⃣ التخصيص║ →→ ║  3️⃣ المراجعة║
  ╚═══════════╝    ╚═══════════╝    ╚═══════════╝
```

| المرحلة | المحتوى | التحقق |
|---------|---------|--------|
| **1** - تحديد النطاق | "من تاريخ" + "إلى تاريخ" + قائمة "الجهة المرسلة" | يجب اختيار الجهة |
| **2** - التخصيص | 4 Checkboxes: رقم الشهادة، المورد، العينات، الإخطار | عمود واحد على الأقل |
| **3** - المراجعة | ملخص شامل للمعايير + عدد الشهادات المطابقة + زر "إصدار" | تأكيد |

- شريط تقدم بصري (Step Indicator) بتأثيرات Glassmorphism
- أزرار "التالي" و "السابق" مع انتقالات حركية (slide transitions)
- عند النقر على "إصدار" → تحميل الملف تلقائياً + إشعار نجاح + انتقال لتبويب "السجل"

**التبويب 2: سجل رسائل الإحالة (Archive)**

| العمود | المصدر |
|--------|--------|
| # تسلسل | ترقيم تلقائي |
| الرقم المرجعي | `ReferenceNumber` |
| التاريخ | `GeneratedAt` |
| الجهة المرسلة | `SenderName` |
| عدد الشهادات | `CertificateCount` |
| عدد العينات | `SampleCount` |

- فلتر بحسب الجهة المرسلة (Dropdown)
- زر 👁️ "مشاهدة" → فتح PDF في تبويب جديد
- زر 🖨️ "طباعة" → فتح في `window.print()`
- زر 🗑️ "حذف" → Soft Delete مع تأكيد
- Pagination

---

#### [NEW] useAdminProceduresStore.ts

Zustand Store واحد بـ **Slices** منظمة:

```typescript
// ═══ Wizard Slice ═══
currentStep: 1 | 2 | 3
startDate, endDate, selectedSender
sendersList: string[]
includeCertNum, includeSupplier, includeSamples, includeNotification
previewCount: number
isGenerating: boolean

// ═══ History Slice ═══
history: ReferralLetter[]
historyPage, historyTotalCount
selectedFilterSender: string | null
isLoadingHistory: boolean

// ═══ Actions ═══
fetchSenders()           // GET /senders (cached)
previewCertificates()    // POST /preview → count only
generateLetter()         // POST /generate → download + refresh history
fetchHistory()           // GET /history
downloadPdf(id)          // GET /{id}/pdf
deleteLetter(id)         // DELETE /{id}
nextStep() / prevStep()
resetWizard()
```

---

#### [MODIFY] App.tsx

```diff
+ import { AdminProcedures } from './pages/AdminProcedures';
  ...
+ <Route path="/procedures" element={<AdminProcedures />} />
```

> الرابط `/procedures` موجود مسبقاً في `Sidebar.tsx` (السطر 15).

---

### المرحلة 5: الأمان والرقابة (Security & Audit)

---

- **Audit Logging:** كل `generate` و `delete` يُسجَّل في `ILogger` مع:
  - اسم المستخدم + التاريخ + الجهة + عدد الشهادات
- **صلاحيات مبدئية:** (قابلة للتوسع لاحقاً مع نظام RBAC)
  - `Admin` → إنشاء + طباعة + حذف
  - `User` → عرض السجل فقط

---

## ملخص الملفات

| الملف | الحالة | الطبقة |
|-------|--------|--------|
| `Models/ReferralLetter.cs` | 🆕 جديد | Backend |
| `Models/ReferralLetterCertificate.cs` | 🆕 جديد | Backend |
| `Data/EnjazDbContext.cs` | ✏️ تعديل | Backend |
| `Controllers/AdminProceduresController.cs` | 🆕 جديد | Backend |
| `Services/ReferralPdfService.cs` | 🆕 جديد | Backend |
| `pages/AdminProcedures.tsx` | 🆕 جديد | Frontend |
| `store/useAdminProceduresStore.ts` | 🆕 جديد | Frontend |
| `App.tsx` | ✏️ تعديل | Frontend |

**الإجمالي:** 6 ملفات جديدة + 2 تعديل

---

## Verification Plan

### Automated Tests
- `POST /generate` بمعايير صحيحة → ملف PDF + سجل في DB + ربط شهادات
- `GET /history` → قائمة مع Pagination + فلتر Sender
- `GET /{id}/pdf` لرسالة محذوف ملفها → إعادة توليد من Snapshot
- `DELETE /{id}` → Soft Delete (السجل لا يظهر في History)
- `POST /preview` بدون sender → خطأ 400

### Manual Verification
- فتح `/procedures` → التنقل بين مراحل المعالج (1→2→3→إصدار)
- إنشاء رسالة → تأكد من تحميل PDF + ظهورها في السجل
- حذف ملف PDF يدوياً → "مشاهدة" تعيد التوليد من Snapshot بنجاح
- تجربة Soft Delete + التأكد من اختفاء السجل
