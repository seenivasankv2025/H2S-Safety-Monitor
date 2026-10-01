import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Login } from './pages/Login';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerLive } from './pages/worker/WorkerLive';
import { WorkerUpload } from './pages/worker/WorkerUpload';
import { WorkerHistory } from './pages/worker/WorkerHistory';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerWorkers } from './pages/manager/ManagerWorkers';
import { ManagerWorkerProfile } from './pages/manager/ManagerWorkerProfile';
import { ManagerAlerts } from './pages/manager/ManagerAlerts';
import { ManagerReports } from './pages/manager/ManagerReports';

const MainLayout = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role?.toUpperCase() === 'MANAGER' ? '/manager/dashboard' : '/worker/dashboard'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<RootRedirect />} />

            {/* Worker Routes */}
            <Route path="worker/dashboard" element={<ProtectedRoute allowedRole="WORKER"><WorkerDashboard /></ProtectedRoute>} />
            <Route path="worker/live" element={<ProtectedRoute allowedRole="WORKER"><WorkerLive /></ProtectedRoute>} />
            <Route path="worker/upload" element={<ProtectedRoute allowedRole="WORKER"><WorkerUpload /></ProtectedRoute>} />
            <Route path="worker/history" element={<ProtectedRoute allowedRole="WORKER"><WorkerHistory /></ProtectedRoute>} />

            {/* Manager Routes */}
            <Route path="manager/dashboard" element={<ProtectedRoute allowedRole="MANAGER"><ManagerDashboard /></ProtectedRoute>} />
            <Route path="manager/workers" element={<ProtectedRoute allowedRole="MANAGER"><ManagerWorkers /></ProtectedRoute>} />
            <Route path="manager/workers/:workerId" element={<ProtectedRoute allowedRole="MANAGER"><ManagerWorkerProfile /></ProtectedRoute>} />
            <Route path="manager/alerts" element={<ProtectedRoute allowedRole="MANAGER"><ManagerAlerts /></ProtectedRoute>} />
            <Route path="manager/reports" element={<ProtectedRoute allowedRole="MANAGER"><ManagerReports /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
