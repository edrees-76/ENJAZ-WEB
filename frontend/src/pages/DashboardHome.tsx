import { useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Activity, FileText, CheckCircle, AlertTriangle, Search, Leaf, ShieldCheck, Box, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Rectangle
} from 'recharts';

export const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [location.key]);
  
  // Custom Active Bar Component for 3D effect on hover
  const renderActiveBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    return (
      <Rectangle 
        {...props}
        x={x - 2}
        y={y - 4}
        width={width + 4}
        height={height + 4}
        fill={fill}
        stroke="#fff"
        strokeWidth={1.5}
        radius={[8, 8, 0, 0]}
        style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.3))', transition: 'all 0.3s ease' }}
      />
    );
  };

  // Map Real Data
  const sampleStats = {
    total: stats?.totalSamples ?? 0,
    today: stats?.samplesToday ?? 0,
    environmental: stats?.samplesEnvironmental ?? 0,
    consumable: stats?.samplesConsumable ?? 0
  };

  const certificateStats = {
    total: stats?.totalCertificates ?? 0,
    today: stats?.certificatesToday ?? 0,
    environmental: stats?.certificatesEnvironmental ?? 0,
    consumer: stats?.certificatesConsumable ?? 0
  };

  const typeData = [
    { name: 'عينات بيئية', value: sampleStats.environmental, color: '#10b981' }, 
    { name: 'عينات استهلاكية', value: sampleStats.consumable, color: '#3b82f6' } 
  ];

  const certTypeData = [
    { name: 'شهادات بيئية', value: certificateStats.environmental, color: '#059669' }, 
    { name: 'شهادات استهلاكية', value: certificateStats.consumer, color: '#2563eb' } 
  ];

  const sampleMonthlyData = stats?.monthlySamples ?? [];
  const certMonthlyData = stats?.monthlyCertificates ?? [];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-black animate-pulse">جاري تحديث إحصائيات المنظومة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-500 font-black">تعذر تحميل الإحصائيات: {error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-6 py-2 bg-slate-200 dark:bg-white/10 rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Section 1: Samples Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg">
              <Box size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>إجمالي العينات</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.total.toLocaleString()}</p>
           </div>
        </GlassCard>
        
        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-lg">
              <Activity size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات اليوم</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.today.toLocaleString()}</p>
           </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg">
              <Leaf size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات بيئية</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.environmental.toLocaleString()}</p>
           </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-xl shadow-lg">
              <CheckCircle size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات استهلاكية</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.consumable.toLocaleString()}</p>
           </div>
        </GlassCard>
      </div>

      {/* Section 2: Certificates Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl shadow-lg">
              <FileText size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>إجمالي الشهادات</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.total.toLocaleString()}</p>
           </div>
        </GlassCard>
        
        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-xl shadow-lg">
              <Activity size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات اليوم</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.today.toLocaleString()}</p>
           </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl shadow-lg">
              <ShieldCheck size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات بيئية</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.environmental.toLocaleString()}</p>
           </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-xl shadow-lg">
              <AlertTriangle size={28} />
           </div>
           <div>
              <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات استهلاكية</p>
              <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.consumer.toLocaleString()}</p>
           </div>
        </GlassCard>
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Sample Monthly Chart */}
         <div className="lg:col-span-2">
           <GlassCard className="h-96 flex flex-col pt-6 overflow-hidden w-full">
              <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>المعدل الشهري (عينات)</h3>
              <div className="w-full px-4 pb-4" dir="ltr" style={{ height: '300px' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={sampleMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="glassEnv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                      </linearGradient>
                      <linearGradient id="glassCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', background: 'rgba(15, 23, 42, 0.8)', border: 'none', color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="environmental" name="بيئية" fill="url(#glassEnv)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                    <Bar dataKey="consumable" name="استهلاكية" fill="url(#glassCons)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
         </div>
         
         {/* Sample Type Pie Chart */}
         <div>
           <GlassCard className="h-96 flex flex-col pt-6 items-center w-full relative">
             <h3 className="font-bold text-xl mb-4 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>توزيع أنواع العينات</h3>
             <div className="w-full relative flex justify-center items-center" style={{ height: '300px' }}>
               <ResponsiveContainer width="95%" height="100%">
                 <PieChart>
                   <Pie
                     data={typeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={85}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {typeData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip />
                   <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={14} wrapperStyle={{ paddingBottom: '10px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </GlassCard>
         </div>
      </div>

      {/* Additional Charts for Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Certificate Monthly Chart */}
         <div className="lg:col-span-2">
           <GlassCard className="h-96 flex flex-col pt-6 overflow-hidden w-full">
              <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>المعدل الشهري (شهادات)</h3>
              <div className="w-full px-4 pb-4" dir="ltr" style={{ height: '300px' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={certMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="glassCertEnv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#064e3b" stopOpacity={0.9}/>
                      </linearGradient>
                      <linearGradient id="glassCertCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', background: 'rgba(15, 23, 42, 0.8)', border: 'none', color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="environmental" name="بيئية" fill="url(#glassCertEnv)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                    <Bar dataKey="consumable" name="استهلاكية" fill="url(#glassCertCons)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
         </div>

         {/* Certificates Type Pie Chart */}
         <div>
           <GlassCard className="h-96 flex flex-col pt-6 items-center w-full relative">
             <h3 className="font-bold text-xl mb-4 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>توزيع أنواع الشهادات</h3>
             <div className="w-full relative flex justify-center items-center" style={{ height: '300px' }}>
               <ResponsiveContainer width="95%" height="100%">
                 <PieChart>
                   <Pie
                     data={certTypeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={85}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {certTypeData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip />
                   <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={14} wrapperStyle={{ paddingBottom: '10px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </GlassCard>
         </div>
      </div>

      {/* Section 3: Quick Actions */}
      <div>
         <GlassCard className="flex flex-col pt-6 items-start w-full">
            <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
               <Activity className="text-blue-500" /> إجراءات سريعة
            </h3>
            <div className="w-full px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <button 
                onClick={() => navigate('/samples?action=add')}
                className="flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-blue-500/20 transition-all border border-white/20 group"
               >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                     <Box className="text-blue-500" size={32} />
                  </div>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>استلام عينة</span>
               </button>

               <button 
                onClick={() => navigate('/certificates?action=add')}
                className="flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-emerald-500/20 transition-all border border-white/20 group"
               >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                     <FileText className="text-emerald-500" size={32} />
                  </div>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>إصدار شهادة</span>
               </button>
               <button 
                onClick={() => navigate('/samples?action=search')}
                className="flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-amber-500/20 transition-all border border-white/20 group"
               >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                     <Search className="text-amber-500" size={32} />
                  </div>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>بحث سريع</span>
               </button>

               <button 
                onClick={() => navigate('/certificates')}
                className="flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-purple-500/20 transition-all border border-white/20 group"
               >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                     <ShieldCheck className="text-purple-500" size={32} />
                  </div>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>سجل الشهادات</span>
               </button>
            </div>
         </GlassCard>
      </div>
    </>
  );
};
