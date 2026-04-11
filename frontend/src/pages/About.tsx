import React, { useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { aboutData } from '../data/aboutData';
import { 
  Award, 
  ShieldAlert,
  Terminal,
  Mail,
  Phone,
  Cpu
} from 'lucide-react';

export const About = () => {
  const { system, features, developer } = aboutData;

  useEffect(() => {
    document.title = `${system.name} | عن المنظومة`;
    window.scrollTo(0, 0);
  }, [system.name]);

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8 px-4 animate-fade-in RTL pb-20">
      
      {/* 1. Hero Section */}
      <section className="text-center space-y-8 relative py-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
        
        <div className="relative inline-block mb-6">
          <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
             <img src="/logo.png" alt="Enjaz Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight">
             {system.name}
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 opacity-90">
            {system.subtitle}
          </h2>
          <p className="text-slate-700 dark:text-blue-100/70 text-lg leading-relaxed font-medium">
            {system.description}
          </p>
        </div>
      </section>

      {/* 2. Features Section */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 justify-center">
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
          <h3 className="text-2xl font-black text-slate-800 dark:text-white px-4">أهم مميزات المنظومة</h3>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <GlassCard key={idx} className="p-8 border-l-4 group" style={{ borderLeftColor: `var(--${feature.color}-500)` }}>
              <div className="flex gap-6 items-start">
                <div className={`p-4 rounded-3xl shrink-0 ${colorMap[feature.color]} group-hover:scale-110 transition-transform`}>
                  <feature.icon size={32} />
                </div>
                <div className="space-y-3 text-right">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h4>
                  <p className="text-slate-700 dark:text-blue-100/70 text-sm leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 3. Unified Developer Card (New Simplified Design) */}
      <section className="max-w-4xl mx-auto">
        <GlassCard className="p-8 md:p-12 relative overflow-hidden group">
           {/* Background Decoration */}
           <div className="absolute -right-20 -top-20 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
             <Cpu size={400} />
           </div>

           <div className="relative flex flex-col items-center text-center gap-8">
              {/* Developer Logo & Identity */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <img 
                    src="/assets/designer_logo.png" 
                    alt="Designer Logo" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                      (e.target as HTMLImageElement).classList.add('opacity-30');
                    }}
                  />
                </div>
                <div className="space-y-4 relative">
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white transition-all">
                      {developer.name}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg md:text-xl">
                      {developer.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="max-w-2xl py-2">
                <p className="text-lg text-slate-700 dark:text-blue-100/80 font-medium leading-relaxed">
                  {developer.bio}
                </p>
              </div>

              {/* Contact Footer (Simplified: Email & Phone Only) */}
              <div className="w-full h-px bg-slate-200 dark:bg-white/10 my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {/* Email Chip */}
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group/item">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover/item:scale-110 transition-transform">
                      <Mail size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-blue-100/80">{developer.contact.email}</span>
                  </div>
                  <span className="text-[10px] items-center gap-1 font-black text-blue-500 hidden sm:flex">البريد الإلكتروني</span>
                </div>

                {/* Phone Chip */}
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group/item">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover/item:scale-110 transition-transform">
                      <Phone size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-blue-100/80" dir="ltr">{developer.contact.phone}</span>
                  </div>
                  <span className="text-[10px] items-center gap-1 font-black text-emerald-500 hidden sm:flex">رقم الهاتف</span>
                </div>
              </div>
           </div>
        </GlassCard>
      </section>
      
      {/* 4. Legal & Footer */}
      <footer className="text-center opacity-40 text-xs py-10 space-y-2">
        <p>© {new Date().getFullYear()} {system.name}. جميع الحقوق محفوظة.</p>
        <p>تصميم وتطوير المهندس إدريس الهرى</p>
      </footer>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
