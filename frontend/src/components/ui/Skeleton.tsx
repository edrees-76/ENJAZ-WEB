/**
 * Skeleton loading placeholder component.
 * Used to show animated placeholder content while data is loading.
 * Uses a shimmer gradient animation for a modern, premium feel (like Facebook/YouTube).
 */

interface SkeletonProps {
  /** Number of rows to render */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
}

/** A single animated skeleton bar with shimmer effect */
const SkeletonBar = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`rounded-lg bg-gradient-to-l from-slate-200 via-slate-100 to-slate-200 dark:from-white/[0.06] dark:via-white/[0.12] dark:to-white/[0.06] bg-[length:200%_100%] animate-shimmer ${className}`}
    style={style}
  />
);

/** Table skeleton: renders a fake table with animated rows */
export const TableSkeleton = ({ rows = 8 }: SkeletonProps) => (
  <div className="space-y-1 p-4">
    {/* Header skeleton */}
    <div className="flex gap-4 mb-4 pb-3 border-b border-slate-200/50 dark:border-white/10">
      <SkeletonBar className="h-5 w-10" />
      <SkeletonBar className="h-5 w-32" />
      <SkeletonBar className="h-5 flex-1" />
      <SkeletonBar className="h-5 w-20" />
      <SkeletonBar className="h-5 w-28" />
      <SkeletonBar className="h-5 w-24" />
    </div>
    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0"
        style={{ opacity: 1 - i * 0.07, animationDelay: `${i * 80}ms` }}
      >
        <SkeletonBar className="h-4 w-10" />
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="h-4 flex-1" />
        <SkeletonBar className="h-4 w-20" />
        <SkeletonBar className="h-4 w-28" />
        <SkeletonBar className="h-4 w-24" />
      </div>
    ))}
  </div>
);

/** Card skeleton: renders placeholder cards */
export const CardSkeleton = ({ rows = 3 }: SkeletonProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl border border-slate-200/50 dark:border-white/10 space-y-3"
      >
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-7 w-16" />
      </div>
    ))}
  </div>
);

/** Dashboard skeleton: full page placeholder for dashboard loading */
export const DashboardSkeleton = () => (
  <div className="w-full space-y-6 px-4 md:px-8 max-w-7xl mx-auto py-8">
    {/* Period tabs */}
    <div className="flex justify-between items-center mb-4">
      <SkeletonBar className="h-6 w-32" />
      <div className="flex gap-2">
        <SkeletonBar className="h-10 w-20 rounded-xl" />
        <SkeletonBar className="h-10 w-20 rounded-xl" />
        <SkeletonBar className="h-10 w-20 rounded-xl" />
        <SkeletonBar className="h-10 w-20 rounded-xl" />
      </div>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-2xl p-6 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-800/30"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <SkeletonBar className="h-4 w-24 mb-5" />
          <SkeletonBar className="h-9 w-16" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 rounded-2xl p-6 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-800/30 flex flex-col">
        <SkeletonBar className="h-5 w-40 mb-6" />
        <div className="flex items-end flex-1 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBar
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${25 + Math.sin(i * 1.2) * 35 + 30}%` }}
            />
          ))}
        </div>
      </div>
      <div className="h-80 rounded-2xl p-6 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-800/30 flex flex-col items-center justify-center">
        <SkeletonBar className="h-5 w-40 mb-8 self-start" />
        <SkeletonBar className="h-44 w-44 rounded-full" />
      </div>
    </div>
  </div>
);

export default SkeletonBar;
