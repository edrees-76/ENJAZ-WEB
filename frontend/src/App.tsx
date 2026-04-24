import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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
import { Landing } from './pages/Landing';
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
import { useAuthStore } from './store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignalRProvider } from './providers/SignalRProvider';
import ToastContainer from './components/ToastContainer';

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
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/welcome", element: <Navigate to="/" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/design-review", element: <DesignReview /> },
  { 
    path: "/app", 
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "samples", element: <Samples /> },
      { path: "certificates", element: <Certificates /> },
      { path: "reports", element: <Reports /> },
      { path: "procedures", element: <AdminProcedures /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
      { path: "help", element: <Help /> },
      { 
        path: "about", 
        element: (
          <Suspense fallback={<div className="p-8 text-center animate-pulse">جاري تحميل واجهة التعريف...</div>}>
            <About />
          </Suspense>
        ) 
      }
    ]
  },
  { path: "/print/certificate/:id", element: <ProtectedRoute><PrintPage /></ProtectedRoute> },
  { path: "*", element: <Navigate to="/" replace /> }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignalRProvider>
        <ToastContainer />
        <RouterProvider router={router} />
      </SignalRProvider>
    </QueryClientProvider>
  );
}

export default App;
