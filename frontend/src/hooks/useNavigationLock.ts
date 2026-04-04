import { useEffect, useCallback } from 'react';
import { useUIStore } from '../store/useUIStore';

/**
 * Custom hook to manage navigation locking across the system.
 */
export const useNavigationLock = () => {
  const { setLocked } = useUIStore();

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
