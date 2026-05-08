import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import UserRegistration from './pages/UserRegistration';
import UserManagement from './pages/UserManagement';
import SiteManagement from './pages/SiteManagement';
import Attendance from './pages/Attendance';
import Payment from './pages/Payment';
import RateManagement from './pages/RateManagement';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'Owner') return <OwnerDashboard />;
  if (user.role === 'Admin') return <AdminDashboard />;
  return <WorkerDashboard />;
};

const UserDelegate = () => {
  const { user } = useAuth();
  if (user?.role === 'Owner') return <UserManagement />;
  return <UserRegistration />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<UserRegistration />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          
          <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
            <Route path="/users" element={<UserDelegate />} />
            <Route path="/onboard" element={<UserRegistration />} />
            <Route path="/attendance" element={<Attendance />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
            <Route path="/sites" element={<SiteManagement />} />
            <Route path="/payments" element={<Payment />} />
            <Route path="/rates" element={<RateManagement />} />
          </Route>
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
