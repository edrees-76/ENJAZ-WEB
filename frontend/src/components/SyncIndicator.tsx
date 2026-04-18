import React, { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useSyncStore } from '../store/useSyncStore';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncIndicator: React.FC = () => {
  const { isOnline, isServerAvailable, isSyncing, pendingCount, failedCount } = useSyncStore();
  const isActuallyConnected = isOnline && isServerAvailable;

  return (
    <div className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2 rounded-full backdrop-blur-xl shadow-sm transition-colors duration-300 bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50">
      <AnimatePresence mode="wait">
        {!isActuallyConnected ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2 rtl:space-x-reverse"
            title="غير متصل بالخادم - يتم حفظ عملك محلياً"
          >
            <WifiOff size={16} className="animate-pulse text-red-500 dark:text-red-400" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">غير متصل</span>
            {pendingCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-red-500/20 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400">
                {pendingCount}
              </span>
            )}
          </motion.div>
        ) : isSyncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2 rtl:space-x-reverse"
            title="جاري مزامنة البيانات المحلية مع الخادم"
          >
            <RefreshCw size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">جاري المزامنة...</span>
          </motion.div>
        ) : pendingCount > 0 ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2 rtl:space-x-reverse"
            title="توجد بيانات في الطابور تنتظر المزامنة"
          >
            <Wifi size={16} className="text-amber-600 dark:text-yellow-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-yellow-400">معلق</span>
            <span className="flex items-center justify-center w-5 h-5 bg-amber-500/20 rounded-full text-[10px] font-bold text-amber-700 dark:text-yellow-400">
              {pendingCount}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2 rtl:space-x-reverse"
            title="متصل وتمت المزامنة بنجاح"
          >
            <Wifi size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">متصل</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show indicator if there are failed items in the queue */}
      {failedCount > 0 && isOnline && !isSyncing && (
         <motion.div
           initial={{ opacity: 0, scale: 0 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex items-center space-x-1 rtl:space-x-reverse text-rose-600 dark:text-rose-400 ml-2"
           title={`${failedCount} عمليات فشلت في المزامنة`}
         >
           <AlertCircle size={14} />
           <span className="text-[10px] font-bold">{failedCount}</span>
         </motion.div>
      )}
    </div>
  );
};
