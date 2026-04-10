import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { DashboardHome } from './pages/DashboardHome';
import { Login } from './pages/Login';
import { Samples } from './pages/Samples';
import Certificates from './pages/Certificates';
import { Reports } from './pages/Reports';
import { PrintPage } from './pages/PrintPage';
import { DesignReview } from './pages/DesignReview';
import { AdminProcedures } from './pages/AdminProcedures';
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
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
        </Route>
        <Route path="/print/certificate/:id" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
