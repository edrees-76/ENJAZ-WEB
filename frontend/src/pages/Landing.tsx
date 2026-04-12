import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Zap, 
  Lock, 
  Server, 
  FileCheck,
  ChevronLeft,
  Moon,
  Sun,
  X
} from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { isDark, toggleTheme } = useUIStore();
  const [activeModal, setActiveModal] = useState<'privacy' | 'sla' | null>(null);

  // إذا كان مسجل دخول، نوجهه فوراً للنظام
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
    // تأكد من تطبيق الثيم المخزن عند أول تحميل للصفحة
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isAuthenticated, navigate, isDark]);

  if (isAuthenticated) return null; // Avoid mounting visual flash

  // Variants for staggered animations
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500 RTL overflow-x-hidden font-sans relative">
      {/* 🌌 Animated Background Mesh Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40 transition-opacity duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300/40 dark:bg-blue-900/40 rounded-full blur-[100px] dark:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-900/30 rounded-full blur-[100px] dark:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-cyan-300/20 dark:bg-cyan-900/20 rounded-full blur-[120px] dark:blur-[150px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      {/* 🧭 Sticky Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 bg-white/70 dark:bg-[#020617]/50 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 border-dashed transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="Enjaz Logo" className="h-14 md:h-16 w-auto object-contain drop-shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-300" />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 border border-slate-300/50 dark:border-white/10 text-slate-700 dark:text-white transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="hidden md:flex px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/10 text-white dark:text-white text-sm font-bold transition-colors"
            >
              دخول المنظومة
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-32">
        
        {/* 1. 🔥 Hero Section */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-10 relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-48 h-48 md:w-64 md:h-64 relative mb-4"
          >
            <div className="absolute inset-4 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none" />
            <img src="/logo.png" alt="Enjaz" className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_40px_rgba(14,165,233,0.3)] dark:drop-shadow-[0_10px_40px_rgba(14,165,233,0.5)]" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight text-slate-800 dark:text-white transition-colors duration-500">
              منظومة إدارية <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-500 dark:to-purple-500">
                بمقاييس عالمية
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed transition-colors duration-500">
              تحكم كامل، تقارير فورية، وأمان سيبراني متقدم لإدارة بياناتك المؤسسية بدقة وسرعة لا تضاهى.
            </p>
          </motion.div>

          {/* Primary CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8"
          >
            <motion.button 
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 40px rgba(168,85,247,0.4)" : "0 0 40px rgba(14,165,233,0.3)" }}
              whileTap={{ scale: 0.97 }}
              className="group relative px-8 md:px-12 py-4 md:py-5 rounded-full bg-gradient-to-l from-cyan-500 via-blue-600 to-purple-700 dark:from-cyan-500 dark:via-purple-600 dark:to-blue-800 text-white font-black text-lg md:text-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              <span className="relative flex items-center gap-3">
                دخول المنظومة
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
              </span>
            </motion.button>
          </motion.div>
        </section>

        {/* 2. ✨ Features Section */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white transition-colors duration-500">قدرات <span className="text-cyan-600 dark:text-cyan-400">لا محدودة</span></h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-500">كل ما تحتاجه لإدارة سير العمل في منصة واحدة الذكية.</p>
          </div>

          <motion.div 
            variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Users, title: "إدارة الهويات", desc: "تحكم دقيق بصلاحيات المستخدمين وتتبع الأنشطة", color: "from-blue-500/10 to-cyan-500/5 dark:from-blue-500/20 dark:to-cyan-500/5" },
              { icon: BarChart3, title: "تقارير ذكية", desc: "إحصائيات تفاعلية ورسوم بيانية لقرارات أسرع", color: "from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/5" },
              { icon: ShieldCheck, title: "أمان سيبراني", desc: "تشفير عالي المستوى ووصول محمي بـ JWT", color: "from-purple-500/10 to-fuchsia-500/5 dark:from-purple-500/20 dark:to-fuchsia-500/5" },
              { icon: FileCheck, title: "شهادات إلكترونية", desc: "إصدار وتصدير الشهادات بصيغ رقمية موثقة", color: "from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/5" },
            ].map((f, i) => (
              <motion.div key={i} variants={itemVars} whileHover={{ y: -10 }} className="relative group p-[1px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10 dark:to-transparent transition-colors duration-500">
                <div className={`absolute inset-0 bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative h-full bg-white/70 dark:bg-[#0f172a]/90 backdrop-blur-md rounded-3xl p-8 space-y-6 border border-slate-200/50 dark:border-white/5 transition-colors duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-sm dark:shadow-none">
                    <f.icon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors duration-500">{f.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-500">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 3. 📊 System Capabilities (Stats) */}
        <section className="py-12 border-y border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.02] transition-colors duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-x-reverse divide-slate-200 dark:divide-white/5">
            {[
              { v: "99.9%", l: "وقت التشغيل" },
              { v: "+10k", l: "عينة معالجة" },
              { v: "0ms", l: "تأخير بالشبكة" },
              { v: "Role-Based", l: "أمان ديناميكي" },
            ].map((s, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">{s.v}</div>
                <div className="text-sm md:text-base text-slate-500 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. ⚙️ How It Works (Timeline) */}
        <section className="space-y-16 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white transition-colors duration-500">سير عمل <span className="text-purple-600 dark:text-purple-400">انسيابي</span></h2>
          </div>
          
          <div className="relative border-r-2 border-slate-200 dark:border-white/10 pr-8 space-y-12 transition-colors duration-500">
            {[
              { icon: Server, title: "الاستلام والتسجيل", desc: "إدخال العينات النظام بمرونة مع إنشاء سجلات تتبع دقيقة." },
              { icon: Zap, title: "المعالجة الفورية", desc: "ترصيد النتائج الفنية ومراجعتها بدعم من واجهة استجابة فورية." },
              { icon: FileCheck, title: "إصدار الشهادات", desc: "توليد ملفات PDF احترافية تحمل توثيقاً نهائياً بجودة طباعة عالمية." },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                <div className="absolute -right-[43px] w-6 h-6 rounded-full bg-slate-50 dark:bg-[#020617] border-4 border-purple-500 transition-colors duration-500" />
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                  <s.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4 transition-colors duration-500" />
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors duration-500">{s.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. 🛡️ Security Section */}
        <section className="bg-gradient-to-br from-blue-100 to-white dark:from-blue-900/20 dark:to-transparent border border-blue-200 dark:border-blue-500/20 rounded-[3rem] p-8 md:p-16 text-center space-y-8 relative overflow-hidden transition-colors duration-500 shadow-sm dark:shadow-none">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
          <Lock className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto transition-colors duration-500" />
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white transition-colors duration-500">أمان سيبراني يمكنك الوثوق به</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto transition-colors duration-500">
            تم بناء إنجاز 2026 على أساسيات الأمان الصارمة. معمارية تعتمد على JWT Authentication، منع الوصول لغير المصرح لهم، وحماية تلقائية لمسارات البيانات.
          </p>
        </section>

      </main>

      {/* 6. Designer Area & Footer */}
      <footer className="relative border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0f172a] pt-20 pb-10 px-6 z-10 RTL transition-colors duration-500">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl flex flex-col md:flex-row items-center gap-8 mb-20 group shadow-sm dark:shadow-none transition-colors duration-500"
          >
            <div className="w-40 md:w-48 shrink-0 flex items-center justify-center transition-all duration-500 group-hover:scale-105 dark:bg-slate-50 dark:p-4 dark:rounded-2xl dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-transparent dark:ring-white/10">
               <img src="/designer_logo.png" alt="EFH Edrees F. Elhery" className="w-full h-auto object-contain drop-shadow-[0_4px_20px_rgba(14,165,233,0.15)] dark:drop-shadow-none transition-all" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
               />
            </div>
            <div className="text-center md:text-right space-y-2">
              <h4 className="text-sm font-bold tracking-widest text-cyan-600 dark:text-cyan-500 uppercase transition-colors duration-500">Architecture & Mastery</h4>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white transition-colors duration-500">تصميم وتطوير: م. إدريس الهرى</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md transition-colors duration-500">
                تمت هندسة هذه المنظومة بأحدث تقنيات الـ Web 3.0 ومعايير المؤسسات الكبرى لضمان استمرارية الأعمال بأداء استثنائي وتجربة مستخدم فاخرة.
              </p>
            </div>
          </motion.div>

          <div className="w-full flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Enjaz" className="h-8 w-auto grayscale opacity-50" />
              <span>© {new Date().getFullYear()} جميع الحقوق محفوظة.</span>
            </div>
            
            <div className="flex gap-6 text-xs font-medium">
              <span onClick={() => setActiveModal('privacy')} className="hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">سياسة الخصوصية</span>
              <span onClick={() => setActiveModal('sla')} className="hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">مستوى الخدمة</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Modals for Footer Links */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 RTL font-sans">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {activeModal === 'privacy' ? 'سياسة الخصوصية وأمن البيانات' : 'اتفاقية مستوى الخدمة (SLA)'}
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pl-2 custom-scrollbar">
                  {activeModal === 'privacy' ? (
                    <>
                      <p><strong>١. طبيعة المنظومة:</strong> منظومة إنجاز 2026 هي بيئة مؤسسية مغلقة (Enterprise System) مصممة لإدارة العينات والإجراءات الإدارية وإصدار الشهادات بطريقة لا مركزية آمنة.</p>
                      <p><strong>٢. التشفير والأمان:</strong> جميع البيانات المتبادلة بين الخوادم والواجهات مشفرة. الهوية محكومة بتقنية (JWT - JSON Web Tokens)، ويتم إنهاء الجلسات تلقائياً عند الخمول من باب الأمان.</p>
                      <p><strong>٣. الصلاحيات الديناميكية:</strong> النفاذ للمنظومة يخضع لمبدأ "الأقل حقاً للوصول" أو (Role-Based Access Control). يتم حجب أي نوافذ لا تقع ضمن اختصاص الموظف بشكل برمجي وموثق.</p>
                      <p><strong>٤. السجلات والمراقبة:</strong> يقوم النظام يومياً بتتبع وتسجيل بصمة أي عملية (إدخال، اعتماد، طباعة) بختم زمني لا رجعة فيه لضمان مبدأ الشفافية والموثوقية.</p>
                    </>
                  ) : (
                    <>
                      <p><strong>١. جاهزية النظام:</strong> صُممت بنية (إنجاز) لتقديم استمرارية عمل بنسبة 99.9% (High Availability)، مدعومة بخدمات تفاعلية لحظية (SignalR) لضمان تزامن البيانات بدون Refresh.</p>
                      <p><strong>٢. الأداء والاستجابة:</strong> تم تهيئة واجهات المنظومة بفضل هندسة (React/Vite) لتتفاعل بزمن انتقال شبه معدوم (Zero-latency) لتعزيز سرعة إنهاء الإجراءات الإدارية والمخبرية.</p>
                      <p><strong>٣. إدارة الأخطاء المركزية:</strong> النظام مزود بآليات متقدمة في (Frontend) تراقب وتحتوي الأخطاء وتمنع الانهيار؛ بمساعدة أداة (Zustand) للحفاظ على حالة البيانات المؤقتة عند انقطاع الاتصال.</p>
                      <p><strong>٤. الدعم الهندسي والصيانة:</strong> كونها منصة (Web 3.0)، تخضع المنظومة لعمليات صيانة وتحديث مبرمجة لضمان التوافق التام مع المستجدات والأنظمة الحديثة وحمايتها من الثغرات.</p>
                    </>
                  )}
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform"
                  >
                    فهمت ذلك
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
