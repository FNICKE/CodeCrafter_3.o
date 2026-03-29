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
import Home from './pages/Home';
import TrustFeed from './pages/Trustfeed';
import Regulatory from './pages/Regulatory';
import Risk from './pages/Riskanalysis';
import Reports from './pages/Reports';
import FinanceChatbot from './pages/FinanceChatbot';
import AIPredictor from './pages/AIPredictor';

// ✅ Import Sidebar
import Sidebar from './components/Sidebar';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="main-content flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/home" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/home" replace /> : <Register />} 
      />

      {/* Protected Routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/chat" element={<FinanceChatbot />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/market" element={<ProtectedLayout><Market /></ProtectedLayout>} />
      <Route path="/portfolio" element={<ProtectedLayout><Portfolio /></ProtectedLayout>} />
      <Route path="/research" element={<ProtectedLayout><ResearchHub /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><AlertsCenter /></ProtectedLayout>} />
      <Route path="/crypto" element={<ProtectedLayout><Crypto /></ProtectedLayout>} />
      <Route path="/screener" element={<ProtectedLayout><Screener /></ProtectedLayout>} />
      <Route path="/recommendations" element={<ProtectedLayout><Recommendations /></ProtectedLayout>} />
      <Route path="/trustfeed" element={<ProtectedLayout><TrustFeed /></ProtectedLayout>} />
      <Route path="/regulatory" element={<ProtectedLayout><Regulatory /></ProtectedLayout>} />
      <Route path="/risk" element={<ProtectedLayout><Risk /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/stock/:symbol?" element={<ProtectedLayout><Stock /></ProtectedLayout>} />
      <Route 
  path="/ai-advisor" 
  element={
    <ProtectedLayout>
      <AIPredictor />
    </ProtectedLayout>
  } 
/>

      {/* AI Chatbot Route */}
      <Route 
        path="/chat" 
        element={
          <ProtectedLayout>
            <FinanceChatbot />
          </ProtectedLayout>
        } 
      />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
         <FinanceChatbot/>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#e2e8f0',
              border: '1px solid #334155',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}