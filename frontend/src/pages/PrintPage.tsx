import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCertificateStore } from '../store/useCertificateStore';
import type { Certificate } from '../store/useCertificateStore';
import CertificatePrintTemplate from '../components/CertificatePrintTemplate';
import { Loader2, Printer, XCircle } from 'lucide-react';

export const PrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchCertificateById } = useCertificateStore();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const data = await fetchCertificateById(parseInt(id));
        if (data) {
          setCertificate(data);
          // Set document title for filename
          document.title = data.certificateNumber || `Certificate_${id}`;
        } else {
          setError('لم يتم العثور على الشهادة المطلوبة');
        }
      } catch (err) {
        setError('حدث خطأ أثناء تحميل بيانات الشهادة');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, fetchCertificateById]);

  useEffect(() => {
    if (certificate && !isLoading) {
      // Auto-trigger print dialog only when ?pdf=true is in the URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('pdf') === 'true') {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [certificate, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xl font-bold text-slate-800">جاري تجهيز الشهادة للطباعة...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-10 text-center">
        <XCircle className="w-20 h-20 text-red-500" />
        <h2 className="text-3xl font-black text-slate-800">{error || 'حدث خطأ غير متوقع'}</h2>
        <button 
          onClick={() => navigate('/certificates')}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold glass-card-hover"
        >
          العودة لقائمة الشهادات
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Instructions - Hidden on Print */}
      <div className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center px-10">
        <div className="flex items-center gap-3">
          <Printer className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-slate-800">معاينة الطباعة: {certificate.certificateNumber}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
          >
            إعادة الطباعة
          </button>
          <button 
            onClick={() => window.close()}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            إغلاق الصفحة
          </button>
        </div>
      </div>

      {/* The Printable Template */}
      <div className="flex justify-center py-10 print:py-0">
        <CertificatePrintTemplate certificate={certificate} standalone={true} />
      </div>
    </div>
  );
};
