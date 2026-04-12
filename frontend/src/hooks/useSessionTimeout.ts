import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 10 * 60 * 1000;     // 10 دقائق
const WARNING_MS = 2 * 60 * 1000;      // تحذير قبل دقيقتين
const CHECK_INTERVAL = 60 * 1000;      // فحص كل دقيقة

/**
 * Hook لانتهاء الجلسة تلقائياً بعد 10 دقائق خمول
 * يتتبع حركة الماوس ولوحة المفاتيح والنقرات
 */
export const useSessionTimeout = () => {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!isAuthenticated) return;

    // Set warning timer
    warningRef.current = setTimeout(() => {
      // You could show a toast/notification here
      console.warn('⚠️ Session will expire in 2 minutes');
    }, TIMEOUT_MS - WARNING_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      console.warn('🔒 Session expired due to inactivity');
      handleLogout();
    }, TIMEOUT_MS);
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity events
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Initial timer
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [isAuthenticated, resetTimer]);
};
