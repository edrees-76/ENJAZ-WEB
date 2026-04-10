import React from 'react';
import type { Certificate, CertificateSample } from '../store/useCertificateStore';
import QRCodeImport from 'react-qr-code';
import BarcodeImport from 'react-barcode';

const QRCode = typeof QRCodeImport === 'function' ? QRCodeImport : (QRCodeImport as any).default || QRCodeImport;
const Barcode = typeof BarcodeImport === 'function' ? BarcodeImport : (BarcodeImport as any).default || BarcodeImport;

interface Props {
  certificate: Certificate;
  standalone?: boolean;
}

const ITEMS_PAGE_1 = 6;
const ITEMS_PAGE_NORMAL = 10;
const ITEMS_PAGE_LAST = 10;

const CertificatePrintTemplate: React.FC<Props> = ({ certificate, standalone = false }) => {
  const samples = certificate.samples || [];
  
  const paginateSamples = (arr: CertificateSample[]) => {
    const pages: CertificateSample[][] = [];
    let currentPos = 0;
    
    // الصفحة الأولى دائماً 6 عينات
    pages.push(arr.slice(0, ITEMS_PAGE_1));
    currentPos = ITEMS_PAGE_1;

    while (currentPos < arr.length) {
      const remaining = arr.length - currentPos;
      
      // نأخذ 10 عينات في كل صفحة تالية حتى النهاية
      const currentBatchSize = Math.min(remaining, ITEMS_PAGE_NORMAL);
      pages.push(arr.slice(currentPos, currentPos + currentBatchSize));
      currentPos += currentBatchSize;
    }
    return pages;
  };

  const pages = paginateSamples(samples);

  if (pages.length === 0) return null;

  return (
    <div id="certificate-print-root" className="certificate-print-container rtl text-black bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {pages.map((pageSamples, pageIndex) => {
        return (
          <div
            key={pageIndex}
            className="certificate-print-page bg-white mx-auto relative flex flex-col p-8"
            style={{
              width: '595pt',
              height: '842pt',
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              overflow: 'hidden',
              paddingBottom: '20pt' // أمان للتذييل للظهور دائماً
            }}
          >
            
            {/* الإطار الخارجي (Border 1pt Black) */}
            <div className="absolute border border-black pointer-events-none" style={{ top: '8pt', bottom: '8pt', left: '8pt', right: '8pt', borderWidth: '1pt' }}></div>

            {/* العلامة المائية (Watermark) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none">
              <img src="/assets/logo_center.png" alt="watermark" style={{ width: '380px' }} />
            </div>

            <div className="relative z-10 w-full flex flex-col flex-1 pt-[15pt] px-[18pt]">
              {/* الهيدر (Header) */}
              <div className={`flex justify-between items-center ${pages.length === 1 ? 'mb-[10pt]' : 'mb-[18pt]'}`}>
                {/* الأيمن (logo_center.png) - شعار الذرة */}
                <div className="flex justify-start items-center" style={{ width: '100pt', height: '100pt' }}>
                  <img src="/assets/logo_center.png" alt="logo center" className="h-full object-contain" />
                </div>
                {/* المنتصف */}
                <div className="text-center flex flex-col justify-center" style={{ gap: '6pt' }}>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, color: 'black' }}>دولة ليبيا</h1>
                  <h2 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, color: 'black' }}>مؤسسة الطاقة الذرية</h2>
                  <h3 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, color: 'black' }}>مركز القياسات الإشعاعية والتدريب</h3>
                </div>
                {/* الأيسر (logo_libya.png) - علم ليبيا */}
                <div className="flex justify-end items-center" style={{ width: '100pt', height: '100pt' }}>
                  <img src="/assets/logo_libya.png" alt="logo libya" className="h-full object-contain" />
                </div>
              </div>

              {/* العنوان والباركود + QR */}
              <div className="flex justify-between items-end mb-[10pt] relative px-2">
                
                {/* الجانب الأيمن (الباركود) - مطابق لصورة Legacy */}
                <div className="flex flex-col items-center justify-end" style={{ width: '30%', height: '100px' }}>
                  <div className="bg-white">
                    <Barcode 
                      value={certificate.certificateNumber && certificate.certificateNumber.trim() !== '' ? certificate.certificateNumber : '0000'}
                      format="CODE128" 
                      width={0.9} 
                      height={33} 
                      displayValue={false} 
                      margin={0}
                      background="transparent"
                    />
                  </div>
                  <div className="mt-1 border border-gray-400 text-center bg-white px-2" style={{ borderWidth: '0.8pt', width: 'auto', minWidth: '180px', whiteSpace: 'nowrap' }}>
                     <span style={{ fontSize: '13pt', fontWeight: 'normal', color: 'black' }}>
                       التاريخ: {new Date(certificate.issueDate).toLocaleDateString('en-CA').replace(/-/g, '/')}
                     </span>
                  </div>
                </div>

                {/* المنتصف - عنوان الوثيقة */}
                <div className="flex justify-center items-center pointer-events-none pb-4" style={{ width: '40%' }}>
                  <h2 style={{ fontSize: '24pt', fontWeight: 'bold', color: 'black' }}>شهادة تحليل عينات</h2>
                </div>

                {/* الجانب الأيسر (QR Code) - مطابق لصورة Legacy */}
                <div className="flex flex-col items-center justify-end" style={{ width: '30%', height: '100px' }}>
                  <div className="bg-white p-1">
                    <QRCode 
                      value={unescape(encodeURIComponent(`الجهة المرسلة: ${certificate.sender || ''}\nالمورد: ${certificate.supplier || ''}\nرقم الإخطار: ${certificate.notificationNumber || ''}\nرقم الإيصال: ${certificate.financialReceiptNumber || ''}\nرقم الشهادة: ${certificate.certificateNumber || ''}`))}
                      size={55}
                      level="Q"
                    />
                  </div>
                  <div className="mt-1 border border-gray-400 text-center bg-white px-2" style={{ borderWidth: '0.8pt', width: 'auto', minWidth: '180px', whiteSpace: 'nowrap' }}>
                     <span style={{ fontSize: '13pt', fontWeight: 'normal', color: 'black' }}>
                       رقم الشهادة: <span dir="ltr">{certificate.certificateNumber}</span>
                     </span>
                  </div>
                </div>
              </div>

              {/* حقول بيانات المورد وتفاصيل التوريد - تظهر فقط في الصفحة الأولى */}
              {pageIndex === 0 && (
                <div style={{ marginBottom: pages.length === 1 ? '5pt' : '8pt' }}>
                  <div className={`flex border border-[#1B4F72] overflow-hidden ${pages.length === 1 ? 'mb-[3pt]' : 'mb-[5pt]'}`} style={{ borderWidth: '0.5pt' }}>
                    <div className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '12pt' : '14pt' }}>السادة</div>
                    <div className="flex-1 bg-[#1B4F72] text-white font-bold p-1 text-right px-4" style={{ fontSize: pages.length === 1 ? '12pt' : '14pt' }}>{certificate.sender}</div>
                  </div>
                  <div className="flex border border-[#1B4F72] overflow-hidden" style={{ borderWidth: '0.5pt' }}>
                    <div className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '12pt' : '14pt' }}>المورد</div>
                    <div className="flex-1 bg-[#EEEEEE] font-bold p-1 text-right px-4 text-black" style={{ fontSize: pages.length === 1 ? '11pt' : '13pt' }}>{certificate.supplier}</div>
                  </div>
                </div>
              )}

              {/* الجدول الرباعي للتفاصيل الثانوية - يظهر فقط في الصفحة الأولى */}
              {pageIndex === 0 && (
                <div className={pages.length === 1 ? 'mb-[5pt]' : 'mb-[10pt]'}>
                  <table className="w-full border-collapse" style={{ border: '0.5pt solid #BDBDBD' }}>
                    <tbody>
                      <tr>
                        <td className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>رقم الإخطار</td>
                        <td className="w-1/4 bg-white p-1 text-center text-black font-normal" style={{ fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>{certificate.notificationNumber || '---'}</td>
                        <td className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>رقم الإقرار الجمركي</td>
                        <td className="flex-1 bg-white p-1 text-center text-black font-normal" style={{ fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>{certificate.declarationNumber || '---'}</td>
                      </tr>
                      <tr>
                        <td className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>بلد المنشأ</td>
                        <td className="w-1/4 bg-white p-1 text-center text-black font-normal" style={{ fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>{certificate.origin || '---'}</td>
                        <td className="bg-[#1B4F72] text-white font-bold p-1 text-center" style={{ width: '110pt', fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>رقم الإيصال المالي</td>
                        <td className="flex-1 bg-white p-1 text-center text-black font-normal" style={{ fontSize: pages.length === 1 ? '11pt' : '12pt', border: '0.5pt solid #BDBDBD' }}>{certificate.financialReceiptNumber || '---'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {certificate.certificateType === 'بيئية' && (
                <div className="mb-[8pt]">
                  <div className="border p-1 text-center font-bold bg-[#EEEEEE]" style={{ fontSize: '13pt', border: '0.5pt solid #BDBDBD' }}>
                    نوع التحليل: تحليل مبدئى ( دون الوصول لحالة الاتزان )
                  </div>
                </div>
              )}

              <div className="font-bold text-black text-right pb-[5pt]" style={{ fontSize: '13pt' }}>
                {certificate.samples && certificate.samples.length <= 1 
                  ? "نفيدكم بأن النشاط الإشعاعي للعينة المحالة كما يلي:" 
                  : "نفيدكم بأن النشاط الإشعاعي للعينات المحالة كما يلي:"}
              </div>

              {/* الجزء الأوسط: الجداول والنتائج */}
              <div>
                <table className="w-full border-collapse" style={{ border: '0.5pt solid #BDBDBD' }}>
                  <thead>
                    <tr className="bg-[#EEEEEE]">
                      <th className="p-1 text-center font-bold" rowSpan={certificate.certificateType === 'بيئية' ? 2 : 1} style={{ width: '4%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>{certificate.certificateType === 'بيئية' ? 'ر.ت' : 'م'}</th>
                      <th className="p-1 text-center font-bold" rowSpan={certificate.certificateType === 'بيئية' ? 2 : 1} style={{ width: certificate.certificateType === 'بيئية' ? '30%' : '50%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>وصف العينة</th>
                      <th className="p-1 text-center font-bold" rowSpan={certificate.certificateType === 'بيئية' ? 2 : 1} style={{ width: '16%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>رقم العينة</th>
                      <th className="p-1 text-center font-bold" rowSpan={certificate.certificateType === 'بيئية' ? 2 : 1} style={{ width: certificate.certificateType === 'بيئية' ? '10%' : '14%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>تاريخ القياس</th>
                      {certificate.certificateType === 'بيئية' ? (
                        <th className="p-1 text-center font-bold" colSpan={5} style={{ width: '40%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>نتيجة القياس ( بيكرل / كجم )</th>
                      ) : (
                        <th className="p-1 text-center font-bold" style={{ width: '16%', border: '0.5pt solid #BDBDBD', fontSize: '12pt' }}>النتيجة (بيكريل / كجم)</th>
                      )}
                    </tr>
                    {certificate.certificateType === 'بيئية' && (
                      <tr className="bg-[#EEEEEE]">
                        <th className="p-1 text-center font-bold" style={{ width: '8%', border: '0.5pt solid #BDBDBD', fontSize: '11pt' }}>K<sub>40</sub></th>
                        <th className="p-1 text-center font-bold" style={{ width: '8%', border: '0.5pt solid #BDBDBD', fontSize: '11pt' }}>Ra<sub>226</sub></th>
                        <th className="p-1 text-center font-bold" style={{ width: '8%', border: '0.5pt solid #BDBDBD', fontSize: '11pt' }}>Th<sub>232</sub></th>
                        <th className="p-1 text-center font-bold" style={{ width: '8%', border: '0.5pt solid #BDBDBD', fontSize: '11pt' }}>R<sub>aeq</sub></th>
                        <th className="p-1 text-center font-bold" style={{ width: '8%', border: '0.5pt solid #BDBDBD', fontSize: '11pt' }}>Cs<sub>137</sub></th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {pageSamples.map((sample, idx) => {
                      // حساب الرقم المتسلسل العالمي (م)
                      const globalIndex = pages.slice(0, pageIndex).reduce((acc, p) => acc + p.length, 0) + idx + 1;
                      
                      return (
                        <tr key={idx} className={idx % 2 !== 0 ? "bg-[#F9F9F9]" : "bg-white"}>
                          <td className="p-1 text-center font-normal" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{certificate.certificateType === 'بيئية' ? (sample.root || globalIndex) : globalIndex}</td>
                          <td className="p-1 text-right px-2 font-normal whitespace-nowrap overflow-hidden text-ellipsis" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt', maxWidth: certificate.certificateType === 'بيئية' ? '150px' : '260px' }}>{sample.description}</td>
                        <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.sampleNumber}</td>
                        <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>
                          {sample.measurementDate ? new Date(sample.measurementDate).toLocaleDateString('en-CA').replace(/-/g, '/') : new Date(certificate.issueDate).toLocaleDateString('en-CA').replace(/-/g, '/')}
                        </td>
                        {certificate.certificateType === 'بيئية' ? (
                          <>
                            <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.isotopeK40 && String(sample.isotopeK40).trim() !== '' ? sample.isotopeK40 : '---'}</td>
                            <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.isotopeRa226 && String(sample.isotopeRa226).trim() !== '' ? sample.isotopeRa226 : '---'}</td>
                            <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.isotopeTh232 && String(sample.isotopeTh232).trim() !== '' ? sample.isotopeTh232 : '---'}</td>
                            <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.isotopeRa && String(sample.isotopeRa).trim() !== '' ? sample.isotopeRa : '---'}</td>
                            <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.isotopeCs137 && String(sample.isotopeCs137).trim() !== '' ? sample.isotopeCs137 : '---'}</td>
                          </>
                        ) : (
                          <td className="p-1 text-center font-normal whitespace-nowrap" style={{ border: '0.5pt solid #BDBDBD', fontSize: '11.5pt' }}>{sample.result || '---'}</td>
                        )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pageIndex === pages.length - 1 && (
                  <div className="text-center font-bold text-black w-full mt-2" style={{ fontSize: '13pt' }}>
                    {certificate.samples && certificate.samples.length <= 1 ? "النتيجة تمثل العينة المقاسة فقط" : "النتائج تمثل العينات المقاسة فقط"}
                    <br />
                    أعطيت هذه الشهادة لاستخدامها فيما يسمح به القانون
                  </div>
                )}

                {pageIndex < pages.length - 1 && (
                  <div className="text-right mt-2 text-black" style={{ fontSize: '14pt', fontWeight: 'bold' }}>يتبع بالصفحة التالية...</div>
                )}
              </div>

              {/* توقيعات الاعتماد - مباشرة بعد نص إخلاء المسؤولية */}
              {pageIndex === pages.length - 1 && (
                <div className={`w-full px-6 ${pages.length === 1 ? 'mt-8' : 'mt-12'}`}>
                  <div className="flex justify-between items-start text-center">
                    {/* أخصائي القياس */}
                    <div className="flex flex-col items-center" style={{ width: '30%' }}>
                      <span className="font-bold text-black" style={{ fontSize: '13pt', marginBottom: '8pt' }}>أخصائي التحليل</span>
                      {certificate.specialistName && <span className="font-bold text-black" style={{ fontSize: '12pt', marginBottom: '2pt' }}>{certificate.specialistName}</span>}
                      <span className="font-bold text-black tracking-normal" style={{ fontSize: '11pt' }}>..........................................</span>
                    </div>

                    {/* رئيس القسم */}
                    <div className="flex flex-col items-center text-center" style={{ width: '40%' }}>
                      <span className="font-bold text-black text-center w-full leading-tight" style={{ fontSize: '13pt', marginBottom: '8pt' }}>
                        رئيس قسم قياس مستوى الإشعاع
                        <br />
                        في السلع الاستهلاكية
                      </span>
                      {certificate.sectionHeadName && <span className="font-bold text-black" style={{ fontSize: '12pt', marginBottom: '2pt' }}>{certificate.sectionHeadName}</span>}
                      <span className="font-bold text-black tracking-normal" style={{ fontSize: '11pt' }}>......................................................</span>
                    </div>

                    {/* مدير الإدارة */}
                    <div className="flex flex-col items-center" style={{ width: '30%' }}>
                      <span className="font-bold text-black w-full text-center" style={{ fontSize: '13pt', marginBottom: '8pt' }}>مدير إدارة القياسات</span>
                      {certificate.managerName && <span className="font-bold text-black" style={{ fontSize: '12pt', marginBottom: '2pt' }}>{certificate.managerName}</span>}
                      <span className="font-bold text-black tracking-normal" style={{ fontSize: '11pt' }}>..........................................</span>
                    </div>
                  </div>
                </div>
              )}

              {/* فاصل مرن لامتصاص المساحة البيضاء المتبقية */}
              <div className="flex-grow"></div>

              {/* تذييل الوثيقة (Footer) */}
              <div className="mt-auto w-full border-t border-gray-300 pt-1">
                  <div className="flex justify-between items-center text-[10pt] font-normal text-black px-2">
                     <div className="text-right">طرابلس - خلة الفرجان - 8 كم طريق قصر بن غشير</div>
                     {pages.length > 1 && (
                       <div className="font-bold text-black" style={{ fontSize: '12pt' }}>صفحة {pageIndex + 1} من {pages.length}</div>
                     )}
                     <div style={{ direction: 'ltr' }}>info@crmt.ly &nbsp;&nbsp; WWW.CRMT.LY &nbsp;&nbsp; +218921151020</div>
                  </div>
              </div>
              
            </div>
          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        ${standalone ? '' : '@media screen { #certificate-print-root { display: none; } }'}
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ${standalone ? '' : `
            body * { visibility: hidden; }
            #certificate-print-root, #certificate-print-root * { visibility: visible; }
            #certificate-print-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          `}
          .certificate-print-page {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
        .rtl { direction: rtl; }
      `}} />
    </div>
  );
};

export default CertificatePrintTemplate;
