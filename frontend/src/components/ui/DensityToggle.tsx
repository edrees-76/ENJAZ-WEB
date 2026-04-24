import { useState, useEffect } from 'react';
import { AlignJustify, AlignCenter, AlignLeft } from 'lucide-react';

export type DensityMode = 'compact' | 'normal' | 'comfortable';

const STORAGE_KEY = 'enjaz-table-density';

/** Returns saved density from localStorage, or default */
export function getSavedDensity(): DensityMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'compact' || saved === 'normal' || saved === 'comfortable') return saved;
  } catch { /* ignore */ }
  return 'normal';
}

/** Save density preference */
function saveDensity(mode: DensityMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
}

/** CSS class map for each density mode */
export const densityClasses: Record<DensityMode, { cell: string; text: string; row: string }> = {
  compact:     { cell: 'px-2.5 py-1.5', text: 'text-xs',  row: 'h-8'  },
  normal:      { cell: 'px-3 py-2.5',   text: 'text-sm',  row: 'h-11' },
  comfortable: { cell: 'px-4 py-3.5',   text: 'text-sm',  row: 'h-14' },
};

interface DensityToggleProps {
  value: DensityMode;
  onChange: (mode: DensityMode) => void;
}

const modes: { key: DensityMode; icon: typeof AlignJustify; label: string }[] = [
  { key: 'compact',     icon: AlignJustify, label: 'مضغوط' },
  { key: 'normal',      icon: AlignCenter,  label: 'عادي' },
  { key: 'comfortable', icon: AlignLeft,    label: 'مريح' },
];

/**
 * DensityToggle — lets users switch between compact/normal/comfortable row density.
 * Persists their choice to localStorage automatically.
 */
export const DensityToggle = ({ value, onChange }: DensityToggleProps) => (
  <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 border border-slate-200 dark:border-white/10">
    {modes.map(({ key, icon: Icon, label }) => (
      <button
        key={key}
        onClick={() => { onChange(key); saveDensity(key); }}
        title={label}
        className={`p-1.5 rounded-lg transition-all ${
          value === key
            ? 'bg-white dark:bg-white/15 text-sky-600 dark:text-sky-400 shadow-sm'
            : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
        }`}
      >
        <Icon className="w-4 h-4" />
      </button>
    ))}
  </div>
);

/** React hook that manages density state with localStorage persistence */
export function useDensity() {
  const [density, setDensity] = useState<DensityMode>(getSavedDensity);
  
  useEffect(() => {
    saveDensity(density);
  }, [density]);

  return { density, setDensity, classes: densityClasses[density] };
}

export default DensityToggle;
