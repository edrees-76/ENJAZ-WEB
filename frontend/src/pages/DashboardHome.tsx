import { useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { AlertsWidget } from '../components/AlertsWidget';
import { CalendarDays, Box, FileText, Search, ShieldCheck, Activity, Loader2, AlertTriangle, RefreshCw, ChevronUp, ChevronDown, Clock, CheckCircle2, TrendingUp, AlertCircle, XCircle, Leaf, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Rectangle
} from 'recharts';

export const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, loading, error, period, targetYear, setPeriod, setTargetYear, fetchStats } = useDashboardStore();
  
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchStats();
  }, [location.key, period]);

  const periods = [
    { id: 'today', label: 'اليوم' },
    { id: 'week', label: 'أسبوع' },
    { id: 'month', label: 'شهر' },
    { id: 'year', label: 'سنة' }
  ];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };
  
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

  const sampleChartData = stats?.chartSamples ?? [];
  const certChartData = stats?.chartCertificates ?? [];

  if (loading && !stats) {
    return <DashboardSkeleton />;
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
      {/* Urgent Alerts Section */}
      <AlertsWidget />

      {/* Period Tabs Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white/40 dark:bg-white/[0.02] p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm gap-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 font-bold px-4">
          <CalendarDays size={18} />
          <span>فترة العرض:</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-center items-center">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${period === p.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95'}`}
            >
              {p.label}
            </button>
          ))}
          
          {period === 'year' && (
            <select
              value={targetYear || currentYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="px-4 py-2.5 rounded-xl font-bold transition-all border outline-none bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/50"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
      {/* Section 1: Samples Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg">
                <Box size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>إجمالي العينات</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.total.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-lg">
                <Activity size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات اليوم</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.today.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg">
                <Leaf size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات بيئية</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.environmental.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-xl shadow-lg">
                <CheckCircle size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>عينات استهلاكية</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{sampleStats.consumable.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Section 2: Certificates Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl shadow-lg">
                <FileText size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>إجمالي الشهادات</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.total.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-xl shadow-lg">
                <ShieldCheck size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات اليوم</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.today.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-xl shadow-lg">
                <Leaf size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات بيئية</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.environmental.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-xl">
             <div className="p-4 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-xl shadow-lg">
                <CheckCircle size={28} />
             </div>
             <div>
                <p className="text-sm font-bold opacity-70" style={{ color: 'var(--text-main)' }}>شهادات استهلاكية</p>
                <p className="text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>{certificateStats.consumer.toLocaleString()}</p>
             </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Sample Chart */}
         <motion.div className="lg:col-span-2" variants={itemVariants}>
           <GlassCard className="h-96 flex flex-col pt-6 overflow-hidden w-full group">
              <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>معدل استلام العينات ({periods.find(p => p.id === period)?.label})</h3>
              <div className="w-full px-4 pb-4" dir="ltr" style={{ height: '300px' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={sampleChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="glassEnv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="glassCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                      contentStyle={{borderRadius: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}} 
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="environmental" name="بيئية" fill="url(#glassEnv)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                    <Bar dataKey="consumable" name="استهلاكية" fill="url(#glassCons)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
         </motion.div>
         
         {/* Sample Type Pie Chart */}
         <motion.div variants={itemVariants}>
           <GlassCard className="h-96 flex flex-col pt-6 items-center w-full relative group">
             <h3 className="font-bold text-xl mb-4 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>توزيع أنواع العينات</h3>
             <div className="w-full relative flex justify-center items-center" style={{ height: '300px' }}>
               <ResponsiveContainer width="95%" height="100%">
                 <PieChart>
                   <Pie
                     data={typeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {typeData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{borderRadius: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'}}
                     itemStyle={{ fontWeight: 'bold' }}
                   />
                   <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={14} wrapperStyle={{ paddingBottom: '10px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </GlassCard>
         </motion.div>
      </div>

      {/* Additional Charts for Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Certificate Chart */}
         <motion.div className="lg:col-span-2" variants={itemVariants}>
           <GlassCard className="h-96 flex flex-col pt-6 overflow-hidden w-full group">
              <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>معدل إصدار الشهادات ({periods.find(p => p.id === period)?.label})</h3>
              <div className="w-full px-4 pb-4" dir="ltr" style={{ height: '300px' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={certChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="glassCertEnv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="glassCertCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                      contentStyle={{borderRadius: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}} 
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="environmental" name="بيئية" fill="url(#glassCertEnv)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                    <Bar dataKey="consumable" name="استهلاكية" fill="url(#glassCertCons)" radius={[6, 6, 0, 0]} barSize={20} activeBar={renderActiveBar} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
         </motion.div>

         {/* Certificates Type Pie Chart */}
         <motion.div variants={itemVariants}>
           <GlassCard className="h-96 flex flex-col pt-6 items-center w-full relative group">
             <h3 className="font-bold text-xl mb-4 border-b border-slate-200/50 w-full pb-3 px-6 text-right" style={{ color: 'var(--text-main)' }}>توزيع أنواع الشهادات</h3>
             <div className="w-full relative flex justify-center items-center" style={{ height: '300px' }}>
               <ResponsiveContainer width="95%" height="100%">
                 <PieChart>
                   <Pie
                     data={certTypeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {certTypeData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{borderRadius: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'}}
                     itemStyle={{ fontWeight: 'bold' }}
                   />
                   <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={14} wrapperStyle={{ paddingBottom: '10px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </GlassCard>
         </motion.div>
      </div>

      {/* Section 3: Quick Actions */}
      <motion.div variants={itemVariants}>
         <GlassCard className="flex flex-col pt-6 items-start w-full group">
            <h3 className="font-bold text-xl mb-6 border-b border-slate-200/50 w-full pb-3 px-6 text-right flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
               <Activity className="text-blue-500" /> إجراءات سريعة
            </h3>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-6">
               <button 
                 onClick={() => navigate('/app/samples?action=add')}
                 className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-slate-100 dark:border-white/5 group"
               >
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                     <Box size={24} />
                  </div>
                  <div className="text-right">
                     <h4 className="font-bold text-slate-800 dark:text-gray-100">استلام عينة</h4>
                  </div>
               </button>

               <button 
                 onClick={() => navigate('/app/certificates?action=add')}
                 className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all border border-slate-100 dark:border-white/5 group"
               >
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                     <FileText size={24} />
                  </div>
                  <div className="text-right">
                     <h4 className="font-bold text-slate-800 dark:text-gray-100">إصدار شهادة</h4>
                  </div>
               </button>

               <button 
                 onClick={() => navigate('/app/samples?action=search')}
                 className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all border border-slate-100 dark:border-white/5 group"
               >
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                     <Search size={24} />
                  </div>
                  <div className="text-right">
                     <h4 className="font-bold text-slate-800 dark:text-gray-100">بحث سريع</h4>
                  </div>
               </button>

               <button 
                 onClick={() => navigate('/app/certificates')}
                 className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all border border-slate-100 dark:border-white/5 group"
               >
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                     <ShieldCheck size={24} />
                  </div>
                  <div className="text-right">
                     <h4 className="font-bold text-slate-800 dark:text-gray-100">سجل الشهادات</h4>
                  </div>
               </button>
            </div>
         </GlassCard>
      </motion.div>
      </motion.div>
    </>
  );
};
