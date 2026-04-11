import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Dashboard } from './pages/Dashboard';
import { DashboardHome } from './pages/DashboardHome';
import { Login } from './pages/Login';
import { Samples } from './pages/Samples';
import Certificates from './pages/Certificates';
import { Reports } from './pages/Reports';
import { PrintPage } from './pages/PrintPage';
import { DesignReview } from './pages/DesignReview';
import { AdminProcedures } from './pages/AdminProcedures';
import { Users } from './pages/Users';
import { Help } from './pages/Help';
import { Settings } from './pages/Settings';
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
import { useAuthStore } from './store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignalRProvider } from './providers/SignalRProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignalRProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/design-review" element={<DesignReview />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              <Route path="samples" element={<Samples />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="reports" element={<Reports />} />
              <Route path="procedures" element={<AdminProcedures />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<Help />} />
              <Route path="about" element={
                <Suspense fallback={<div className="p-8 text-center animate-pulse">جاري تحميل واجهة التعريف...</div>}>
                  <About />
                </Suspense>
              } />
            </Route>
            <Route path="/print/certificate/:id" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </SignalRProvider>
    </QueryClientProvider>
  );
}

export default App;
