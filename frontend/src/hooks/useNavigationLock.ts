import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';

/**
 * Custom hook to manage navigation locking across the system.
 * Uses a ref-based approach to prevent infinite re-render loops.
 */
export const useNavigationLock = () => {
  // Use a selector to get only the setLocked function - this is stable
  const setLocked = useUIStore((state) => state.setLocked);
  const isLocked = useUIStore((state) => state.isLocked);
  const setShowNavWarning = useUIStore((state) => state.setShowNavWarning);

  // Block react-router navigation (Back button, Links, etc.)
  useBlocker(({ currentLocation, nextLocation }) => {
    if (isLocked && currentLocation.pathname !== nextLocation.pathname) {
      setShowNavWarning(true);
      return true; // Block navigation
    }
    return false; // Allow navigation
  });

  const lock = useCallback(() => {
    setLocked(true);
  }, [setLocked]);

  const unlock = useCallback(() => {
    setLocked(false);
  }, [setLocked]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useUIStore.getState().isLocked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setLocked(false);
    };
  }, [setLocked]);

  return { lock, unlock };
};
