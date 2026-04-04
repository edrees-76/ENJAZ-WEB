import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { DashboardHome } from './pages/DashboardHome';
import { Login } from './pages/Login';
import { Samples } from './pages/Samples';
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
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="samples" element={<Samples />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
