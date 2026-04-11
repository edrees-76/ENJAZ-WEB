import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

// ═══════════════════════════════════════════════
// M8: Global SignalR Provider — اتصال واحد فقط لكل التطبيق
// ═══════════════════════════════════════════════

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5144/hubs/alerts/v1';

interface SignalRContextType {
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType>({ isConnected: false });

export const useSignalRStatus = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const retryCountRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      // لا يوجد توكن — أغلق أي اتصال موجود
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // إذا يوجد اتصال نشط، لا تُنشئ آخر
    if (connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Backoff مدمج
      .configureLogging(signalR.LogLevel.Warning) // تقليل noise في الكونسول
      .build();

    // M7: Exponential Backoff مع حد أقصى
    const startConnection = async () => {
      try {
        await connection.start();
        retryCountRef.current = 0;
        setIsConnected(true);
        console.log('✅ SignalR متصل بقناة التنبيهات');
      } catch (err) {
        setIsConnected(false);
        const maxRetries = 8;
        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(5000 * Math.pow(2, retryCountRef.current), 60000);
          retryCountRef.current++;
          console.warn(`⚠️ SignalR: إعادة محاولة ${retryCountRef.current}/${maxRetries} بعد ${delay / 1000}ث`);
          setTimeout(startConnection, delay);
        } else {
          console.error('❌ SignalR: تم استنفاد محاولات الاتصال.');
        }
      }
    };

    // استقبال الإشعارات — تحديث React Query cache
    connection.on('NotificationReceived', (payload) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      retryCountRef.current = 0;
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    connectionRef.current = connection;
    startConnection();

    return () => {
      connection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [token, queryClient]);

  return (
    <SignalRContext.Provider value={{ isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};
