import { useEffect, useCallback } from 'react';
import { useUIStore } from '../store/useUIStore';

/**
 * Custom hook to manage navigation locking across the system.
 * Uses a ref-based approach to prevent infinite re-render loops.
 */
export const useNavigationLock = () => {
  // Use a selector to get only the setLocked function - this is stable
  const setLocked = useUIStore((state) => state.setLocked);

  const lock = useCallback(() => {
    setLocked(true);
  }, [setLocked]);

  const unlock = useCallback(() => {
    setLocked(false);
  }, [setLocked]);

  useEffect(() => {
    return () => {
      setLocked(false);
    };
  }, [setLocked]);

  return { lock, unlock };
};
