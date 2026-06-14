import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

// Error boundary fallback
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0b0f19]">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong</h2>
          <p className="text-xs text-gray-500 mb-4">The application encountered an unexpected runtime error.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accentNavy border border-teal-800 text-accentTeal text-xs font-bold rounded-lg"
          >
            Reload Console
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#0b0f19]">
        <div className="w-10 h-10 border-4 border-t-accentTeal border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Workspace Console */}
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                
                {/* Legacy or sub-route mapping for compliance with prompt phase requirements */}
                <Route path="/discovery" element={<Navigate to="/dashboard" replace />} />
                <Route path="/requirements" element={<Navigate to="/dashboard" replace />} />
                <Route path="/architecture" element={<Navigate to="/dashboard" replace />} />
                <Route path="/tradeoffs" element={<Navigate to="/dashboard" replace />} />
                <Route path="/decision-memory" element={<Navigate to="/dashboard" replace />} />
                <Route path="/report" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
