import { useToastStore } from '../store/useToastStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed top-4 right-4 z-[9999] space-y-3 min-w-[300px]"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-2xl shadow-xl backdrop-blur-xl border ${
              toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white dark:bg-emerald-900/90 dark:border-emerald-700' : ''
            } ${
              toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white dark:bg-rose-900/90 dark:border-rose-700' : ''
            } ${
              toast.type === 'info' ? 'bg-sky-500/90 border-sky-400 text-white dark:bg-sky-900/90 dark:border-sky-700' : ''
            }`}
          >
            <div className="flex justify-between items-center gap-4">
              <span className="font-bold tracking-wide">{toast.message}</span>

              <div className="flex items-center gap-3 shrink-0">
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action!.onClick();
                      removeToast(toast.id);
                    }}
                    className="underline text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {toast.action.label}
                  </button>
                )}

                <button 
                  onClick={() => removeToast(toast.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
