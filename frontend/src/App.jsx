import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import DoctorManagement from './pages/DoctorManagement';
import AppointmentCalendar from './pages/AppointmentCalendar';

// Doctor Pages
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import ConsultationPanel from './pages/ConsultationPanel';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard';
import DoctorSearch from './pages/DoctorSearch';
import BookingWizard from './pages/BookingWizard';
import MedicationReminders from './pages/MedicationReminders';
import PatientProfile from './pages/PatientProfile';

/**
 * Route protection wrapper based on authentication status and user roles
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but unauthorized role, redirect to their home portal
    if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Common dashboard layout wrapping sidebar and navbar
 */
const PortalLayout = () => {
  return (
    <div className="flex w-full min-h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}/dashboard`} replace />} />

      {/* Protected Patient Routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/search" element={<DoctorSearch />} />
          <Route path="/patient/book/:doctorId" element={<BookingWizard />} />
          <Route path="/patient/reminders" element={<MedicationReminders />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>
      </Route>

      {/* Protected Doctor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/consult/:id" element={<ConsultationPanel />} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/doctors" element={<DoctorManagement />} />
          <Route path="/admin/calendar" element={<AppointmentCalendar />} />
        </Route>
      </Route>

      {/* Fallback routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
