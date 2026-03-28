import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import ResearchHub from './pages/ResearchHub';
import AlertsCenter from './pages/AlertsCenter';
import Crypto from './pages/Crypto';
import Screener from './pages/Screener';
import Recommendations from './pages/Recommendations';
import Stock from './pages/Stock';

// Layout
import Sidebar from './components/Sidebar';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent-blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/market" element={<ProtectedLayout><Market /></ProtectedLayout>} />
      <Route path="/portfolio" element={<ProtectedLayout><Portfolio /></ProtectedLayout>} />
      <Route path="/research" element={<ProtectedLayout><ResearchHub /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><AlertsCenter /></ProtectedLayout>} />
      <Route path="/crypto" element={<ProtectedLayout><Crypto /></ProtectedLayout>} />
      <Route path="/screener" element={<ProtectedLayout><Screener /></ProtectedLayout>} />
      <Route path="/recommendations" element={<ProtectedLayout><Recommendations /></ProtectedLayout>} />
      <Route path="/stock" element={<ProtectedLayout><Stock /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 13 },
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </AuthProvider>
    </BrowserRouter>
  );
}
