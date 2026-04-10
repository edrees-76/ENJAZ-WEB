import React from 'react';
import CertificatePrintTemplate from '../components/CertificatePrintTemplate';
import type { Certificate } from '../store/useCertificateStore';

const mockCert = (idNum: number, sampleCount: number): Certificate => ({
  id: String(idNum),
  certificateNumber: `RM-C-26-${String(idNum).padStart(4, '0')}`,
  certificateType: 'استهلاكية',
  sender: 'مصلحة الجمارك الليبية - ميناء طرابلس',
  supplier: 'شركة الفيحاء للاستيراد والتصدير',
  origin: 'تركيا',
  analysisType: 'فيزيائي',
  sampleCount,
  declarationNumber: '554433',
  notificationNumber: '998877',
  policyNumber: '776655',
  financialReceiptNumber: '112233',
  issueDate: new Date().toISOString(),
  specialistName: 'المهندس علي محمد',
  sectionHeadName: 'د. خالد عبدالله',
  managerName: 'م. إبراهيم يونس',
  notes: 'العينات مطابقة للمواصفات القياسية الليبية رقم 595 لسنة 2011',
  samples: Array.from({ length: sampleCount }, (_, i) => ({
    id: i + 1,
    root: i + 1,
    description: `عينة اختبار رقم ${i + 1} - وصف تجريبي للمنتج المستورد`,
    sampleNumber: (300 + i).toString(),
    measurementDate: new Date().toISOString(),
    result: 'خالية من العناصر المشعة المصنعة'
  }))
});

export const DesignReview: React.FC = () => {
  const cert6 = mockCert(6, 6);
  const cert28 = mockCert(28, 28);
  const cert40 = mockCert(40, 40);

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-10 text-center">مراجعة التوزيع الجديد للشهادات (6 أولى - ثم 10)</h1>
      
      <div className="flex flex-col gap-20 items-center">
        <section className="bg-white p-5 shadow-xl w-full max-w-[1000px]">
          <h2 className="text-xl font-bold mb-5 border-b pb-2">1. شهادة بـ 6 عينات (صفحة واحدة - تنسيق رشيق)</h2>
          <div className="border border-dashed border-red-300 p-2 overflow-auto max-h-[800px]">
            <style>{`.certificate-print-container { display: block !important; } @media screen { .certificate-print-container { display: block !important; } }`}</style>
            <CertificatePrintTemplate certificate={cert6} />
          </div>
        </section>

        <section className="bg-white p-5 shadow-xl w-full max-w-[1000px]">
          <h2 className="text-xl font-bold mb-5 border-b pb-2">2. شهادة بـ 28 عينة (4 صفحات: 6 ثم 10 ثم 10 ثم 2)</h2>
          <div className="border border-dashed border-red-300 p-2 overflow-auto max-h-[800px]">
            <CertificatePrintTemplate certificate={cert28} />
          </div>
        </section>

        <section className="bg-white p-5 shadow-xl w-full max-w-[1000px]">
          <h2 className="text-xl font-bold mb-5 border-b pb-2">3. شهادة بـ 40 عينة (5 صفحات: 6 ثم 10 ثم 10 ثم 10 ثم 4)</h2>
          <div className="border border-dashed border-red-300 p-2 overflow-auto max-h-[800px]">
            <CertificatePrintTemplate certificate={cert40} />
          </div>
        </section>
      </div>
    </div>
  );
};
