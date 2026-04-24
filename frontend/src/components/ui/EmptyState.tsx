import { FileX, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState component — shown when a table or list has no data.
 * Provides a clear visual cue and an optional action button.
 */
export const EmptyState = ({
  icon,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي سجلات مطابقة لمعايير البحث.',
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-5 border border-slate-200 dark:border-white/10">
      {icon || <FileX className="w-9 h-9 text-slate-400 dark:text-gray-500" />}
    </div>
    <h3 className="text-lg font-bold text-slate-600 dark:text-gray-300 mb-1.5">{title}</h3>
    <p className="text-sm text-slate-400 dark:text-gray-500 max-w-xs leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-5 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-sky-500/20 flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
