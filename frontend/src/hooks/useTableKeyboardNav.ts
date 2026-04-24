import { useState, useEffect, useCallback } from 'react';

interface UseTableKeyboardNavProps {
  itemCount: number;
  onSelect?: (index: number) => void;
  enabled?: boolean;
}

export const useTableKeyboardNav = ({
  itemCount,
  onSelect,
  enabled = true,
}: UseTableKeyboardNavProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(null);
  }, [itemCount]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      // Ignore keyboard nav if user is typing in an input or textarea
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // Prevent page scrolling
          setSelectedIndex((prev) => {
            if (prev === null) return 0;
            return prev < itemCount - 1 ? prev + 1 : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault(); // Prevent page scrolling
          setSelectedIndex((prev) => {
            if (prev === null) return 0;
            return prev > 0 ? prev - 1 : prev;
          });
          break;
        case 'Enter':
          if (selectedIndex !== null && onSelect) {
            e.preventDefault();
            onSelect(selectedIndex);
          }
          break;
        case 'Escape':
          setSelectedIndex(null);
          break;
      }
    },
    [itemCount, enabled, selectedIndex, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { selectedIndex, setSelectedIndex };
};
