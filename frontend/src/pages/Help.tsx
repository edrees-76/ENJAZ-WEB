import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
  HelpCircle, Search, BookOpen, MessageSquare, Keyboard, 
  ChevronDown, ChevronUp, Box, FileText, Activity, 
  ShieldCheck, Leaf, AlertCircle, CheckCircle, Info,
  Printer, Save, X, ArrowRight, UserPlus, Settings, MousePointer2,
  Mail, Phone
} from 'lucide-react';

const colorMap: Record<string, string> = {
  indigo: 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 group-hover:bg-indigo-500 from-indigo-500/20',
  emerald: 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 group-hover:bg-emerald-500 from-emerald-500/20',
  purple: 'text-purple-500 bg-purple-500/10 hover:bg-purple-500 group-hover:bg-purple-500 from-purple-500/20',
  amber: 'text-amber-500 bg-amber-500/10 hover:bg-amber-500 group-hover:bg-amber-500 from-amber-500/20'
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/50 dark:border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-right hover:text-blue-500 transition-colors group"
      >
        <span className="font-bold text-slate-800 dark:text-blue-100">{question}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-slate-700 dark:text-blue-100/80 leading-relaxed animate-fade-in text-right font-medium">
          {answer}
        </div>
      )}
    </div>
  );
};

interface GuideStep {
  title: string;
  description: string;
  icon: any;
}

interface Guide {
  id: string;
  title: string;
  icon: any;
  color: string;
  steps: GuideStep[];
}

const guides: Guide[] = [
  {
    id: 'lifecycle',
    title: 'دورة حياة العينات',
    icon: Box,
    color: 'indigo',
    steps: [
      { title: 'استلام العينة', description: 'يتم تسجيل بيانات المورد والطلب، وتوليد باركود فريد لكل عينة لضمان التتبع.', icon: UserPlus },
      { title: 'الفحص والمطابقة', description: 'تخضع العينة للفحص المخبري بناءً على المعايير المعتمدة (بيئية أو استهلاكية).', icon: Search },
      { title: 'إدخال النتائج', description: 'يتم إدخال نتائج الفحص في المنظومة لتحديد مدى مطابقتها للمواصفات.', icon: Save },
      { title: 'إغلاق السجل', description: 'بعد التأكد من النتائج، يتم تحويل السجل لمرحلة إصدار الشهادة النهائية.', icon: CheckCircle },
    ]
  },
  {
    id: 'certificates',
    title: 'إصدار الشهادات',
    icon: FileText,
    color: 'emerald',
    steps: [
      { title: 'اختيار الطلب', description: 'اختر عينة من قائمة العينات المكتملة فحوصاتها والجاهزة للإصدار.', icon: MousePointer2 },
      { title: 'ملء بيانات الشهادة', description: 'تأكد من صحة النتائج النهائية واسم الشخص الذي قام بالفحص.', icon: Activity },
      { title: 'الاعتماد النهائي', description: 'اضغط على زر "إصدار الشهادة النهائية" لتوليد رقم تسلسلي معتمد.', icon: ShieldCheck },
      { title: 'الطباعة المباشرة', description: 'سيقوم النظام بفتح نافذة الطباعة تلقائياً للشهادة بصيغة PDF.', icon: Printer },
    ]
  },
  {
    id: 'reports',
    title: 'إدارة التقارير',
    icon: Activity,
    color: 'purple',
    steps: [
      { title: 'تحديد النطاق', description: 'استخدم فلاتر التاريخ (من تاريخ / إلى تاريخ) لتحديد الفترة المطلوبة.', icon: Info },
      { title: 'اختيار الفلاتر', description: 'يمكنك التصفية حسب نوع العينة (استهلاكي/بيئي) أو حسب الجهة الموردة.', icon: Search },
      { title: 'تحليل البيانات', description: 'استعرض الرسوم البيانية لفهم معدلات الإنجاز وتوزيع العينات شهرياً.', icon: Activity },
      { title: 'التصدير', description: 'قم بتحميل التقرير النهائي كملف Excel أو PDF لمشاركته رسمياً.', icon: Save },
    ]
  },
  {
    id: 'security',
    title: 'الأمان والصلاحيات',
    icon: ShieldCheck,
    color: 'amber',
    steps: [
      { title: 'إدارة المستخدمين', description: 'إضافة حسابات الموظفين الجدد وتفعيلهم في المنظومة.', icon: UserPlus },
      { title: 'تحديد الأدوار', description: 'منح كل مستخدم صلاحيات محددة (مدير، فني، مدخل بيانات) لضمان حماية البيانات.', icon: Settings },
      { title: 'رقابة السجلات', description: 'متابعة "سجل النشاطات" لمعرفة من قام بأي إجراء وفي أي وقت.', icon: Activity },
      { title: 'تحديث الحساب', description: 'يمكن لكل مستخدم تحديث كلمة المرور الخاصة به لضمان أمان حسابه.', icon: ShieldCheck },
    ]
  }
];

export const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const faqs = [
    {
      question: "كيف أقوم بإضافة عينات جديدة للمنظومة؟",
      answer: "من القائمة الجانبية اختر 'استلام العينات' (Samples)، ثم اضغط على زر 'إضافة سجل جديد'. قم بتعبئة البيانات الأساسية مثل رقم الطلب والمورد، ثم أضف قائمة العينات في الجدول السفلي واضغط حفظ."
    },
    {
      question: "كيف يمكنني إصدار شهادة نهائية لعينة تم استلامها؟",
      answer: "انتقل إلى صفحة 'إصدار الشهادات' (Certificates). ستظهر لك جميع العينات التي لم تصدر لها شهادات بعد. اضغط على 'إصدار شهادة' بجانب العينة المطلوبة، أكمل البيانات (مثل النتيجة والتاريخ)، ثم اضغط 'إصدار الشهادة النهائية'."
    },
    {
      question: "ما الفرق بين العينات البيئية (Environmental) والاستهلاكية (Consumable)؟",
      answer: "العينات البيئية تتعلق بمواد من الطبيعة أو مياه غير معبأة، بينما الاستهلاكية تتعلق بالمواد الغذائية والسلع الموجهة للاستهلاك البشري المباشر. المنظومة تفصل بينهما في التقارير والإحصائيات وتستخدم ألوان تمييز مختلفة (الأزرق للاستهلاكي والأخضر للبيئي)."
    },
    {
      question: "كيف أسترجع تقارير شهرية أو سنوية؟",
      answer: "من قسم 'التقارير الذكية' (Reports)، اختر نوع التقرير (عام أو حسب جهة)، حدد الفترة الزمنية (من تاريخ / إلى تاريخ)، ثم اضغط تحميل التقرير. يمكنك لاحقاً تصدير البيانات إلى Excel أو PDF."
    }
  ];

  // Search Logic
  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = filteredGuides.length > 0 || filteredFaqs.length > 0;

  return (
    <div className="space-y-8 animate-fade-in RTL">
      {/* Header & Search */}
      <div className="text-center space-y-4 max-w-2xl mx-auto py-6">
        <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-2">
          <HelpCircle size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white">مركز المساعدة والدعم</h1>
        <p className="text-slate-800 dark:text-blue-100/70 leading-relaxed font-medium">
          أهلاً بك في دليل استخدام منظومة إنجاز 2026. هنا ستجد كل ما تحتاجه للتعامل مع النظام بكفاءة.
        </p>
        
        <div className="relative mt-8 group text-right">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="ابحث عن سؤال، ميزة، أو دليل عمل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-4 pr-12 pl-6 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-300 dark:border-white/20 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-lg text-right font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Guides & FAQs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Search Feedback */}
          {searchQuery && (
            <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                نتائج البحث عن: <span className="font-bold underline">"{searchQuery}"</span>
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
              >
                مسح البحث
              </button>
            </div>
          )}

          {!hasResults && searchQuery && (
            <GlassCard className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200 dark:border-white/10">
              <div className="inline-flex p-4 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400">
                <Search size={40} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">عذراً، لم نجد نتائج تطابق بحثك</h4>
              <p className="text-sm text-slate-500 dark:text-blue-100/50">جرب البحث بكلمات أبسط مثل "عينة"، "تقرير"، أو "شهادة".</p>
            </GlassCard>
          )}

          {/* Quick Guides Section (Activated) */}
          {filteredGuides.length > 0 && (
            <section className="animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen size={22} className="text-blue-500" /> أدلة الاستخدام السريعة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides.map((guide) => (
                  <button 
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className="group text-right"
                  >
                    <GlassCard className="p-5 hover:border-blue-500/50 transition-all cursor-pointer group-hover:bg-white/80 dark:group-hover:bg-white/10 h-full">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl transition-all ${colorMap[guide.color].split(' ').filter(c => c.includes('bg-') || c.includes('text-')).join(' ')}`}>
                          <guide.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-white">{guide.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-blue-100/60 mt-1 lines-2 font-medium">
                            إضغط هنا للاطلاع على شرح مفصل للخطوات الخاصة بـ {guide.title.toLowerCase()}.
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </GlassCard>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {filteredFaqs.length > 0 && (
            <section className="animate-in fade-in duration-500">
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200/50 dark:border-white/5 pb-4">
                  <MessageSquare size={22} className="text-cyan-500" /> الأسئلة الشائعة
                </h3>
                <div className="space-y-1">
                  {filteredFaqs.map((faq, idx) => (
                    <FAQItem key={idx} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </GlassCard>
            </section>
          )}
        </div>

        {/* Right Sidebar Elements */}
        <div className="space-y-8">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Info size={20} className="text-blue-500" /> دليل الحالات والألوان
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-right">
                <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">حالة مكتملة</p>
                  <p className="text-[10px] text-slate-600 dark:text-blue-100/50 font-medium">تم استكمال جميع البيانات وإصدار الشهادة.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-right">
                <Leaf className="text-blue-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">عينات بيئية</p>
                  <p className="text-[10px] text-slate-600 dark:text-blue-100/50 font-medium">تخص العينات المستلمة في القسم البيئي.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-right">
                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400">قيد الانتظار</p>
                  <p className="text-[10px] text-slate-600 dark:text-blue-100/50 font-medium">عينة مسجلة بانتظار إدخال النتائج.</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Keyboard size={20} className="text-indigo-500" /> اختصارات سريعة
            </h3>
            <div className="space-y-3">
              {[
                { label: 'حفظ النموذج', key: 'Enter' },
                { label: 'إغلاق / إلغاء', key: 'Esc' },
                { label: 'طباعة فورية', key: 'Ctrl + P' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-200/50 dark:border-white/5 pb-2">
                  <span className="text-slate-700 dark:text-blue-100/80 font-medium">{item.label}</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded text-xs font-mono font-bold">{item.key}</kbd>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-700 rounded-[2rem] text-white shadow-xl relative overflow-hidden group border border-white/10">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck size={160} />
            </div>
            <h4 className="font-bold text-xl mb-2 text-right">الدعم الفني</h4>
            <p className="text-sm opacity-90 mb-4 leading-relaxed text-right font-medium">
              المهندس: إدريس فتح الله الهرى
            </p>
            
            <div className="space-y-3 mb-6 relative z-10">
              <div className="flex items-center justify-end gap-2 text-xs opacity-80 hover:opacity-100 transition-opacity">
                <span>edreeselhery@gmail.com</span>
                <Mail size={14} />
              </div>
              <div className="flex items-center justify-end gap-2 text-xs opacity-80 hover:opacity-100 transition-opacity">
                <span>0925126355 / 0917730110</span>
                <Phone size={14} />
              </div>
            </div>

            <a 
              href="mailto:edreeselhery@gmail.com"
              className="w-full py-3 bg-white text-slate-900 dark:text-blue-600 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Mail size={18} /> مراسلة الدعم
            </a>
          </div>
        </div>
      </div>

      {/* Guide Modal Overlay */}
      {selectedGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedGuide(null)}
          />
          <GlassCard className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden rounded-[2.5rem] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${colorMap[selectedGuide.color].split(' ').find(c => c.startsWith('from-'))} to-transparent flex items-center justify-between border-b border-slate-200 dark:border-white/10`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${colorMap[selectedGuide.color].split(' ').find(c => c.startsWith('bg-'))}`}>
                  <selectedGuide.icon size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedGuide.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-blue-100/50">دليل خطوة بخطوة</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content - Steps */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {selectedGuide.steps.map((step, idx) => (
                <div key={idx} className="flex gap-6 relative group">
                  {/* Step Number & Connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all
                      ${idx === 0 ? `${colorMap[selectedGuide.color].split(' ').find(c => c.startsWith('bg-')).replace('/10', '')} text-white shadow-lg` : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10'}
                    `}>
                      {idx + 1}
                    </div>
                    {idx !== selectedGuide.steps.length - 1 && (
                      <div className="w-0.5 grow bg-slate-200 dark:bg-white/5 my-2" />
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="pb-6 flex-1 text-right">
                    <div className="flex items-center gap-2 mb-2">
                       <h4 className="text-lg font-bold text-slate-800 dark:text-white grow">{step.title}</h4>
                       <step.icon size={20} className={`${colorMap[selectedGuide.color].split(' ').find(c => c.startsWith('text-'))} opacity-40`} />
                    </div>
                    <p className="text-slate-700 dark:text-blue-100/80 text-sm leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedGuide(null)}
                className="px-8 py-3 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                فهمت ذلك
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Custom styles for stepper and scrollbar */}
      <style>{`
        .lines-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 10px;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
