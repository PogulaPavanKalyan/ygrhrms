import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Loader from './components/common/Loader';

// Pages - Lazy loaded
const Login = lazy(() => import('./pages/Login'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const TLDashboard = lazy(() => import('./pages/TLDashboard'));
const MDDashboard = lazy(() => import('./pages/MDDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Payslips = lazy(() => import('./pages/Payslips'));
const Payroll = lazy(() => import('./pages/Payroll'));
const HolidayCalendar = lazy(() => import('./pages/HolidayCalendar'));
const Leave = lazy(() => import('./pages/Leave'));
const Messages = lazy(() => import('./pages/Messages'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Settings = lazy(() => import('./pages/Settings'));
const Calls = lazy(() => import('./pages/Calls'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Exams = lazy(() => import('./pages/Exams'));
const Register = lazy(() => import('./pages/Register'));

// Component to handle default redirect on landing page based on role
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  const roleRedirects = {
    Employee: '/employee-dashboard',
    TeamLead: '/tl-dashboard',
    Manager: '/manager-dashboard',
    HR: '/hr-dashboard',
    MD: '/md-dashboard',
  };
  return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loader message="Loading portal dashboard..." />}>
          <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes utilizing Layout Shell */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Landing redirect */}
            <Route index element={<HomeRedirect />} />

            {/* Dashboards */}
            <Route path="employee-dashboard" element={
              <ProtectedRoute allowedRoles={['Employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="hr-dashboard" element={
              <ProtectedRoute allowedRoles={['HR']}>
                <HRDashboard />
              </ProtectedRoute>
            } />
            <Route path="manager-dashboard" element={
              <ProtectedRoute allowedRoles={['Manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="tl-dashboard" element={
              <ProtectedRoute allowedRoles={['TeamLead']}>
                <TLDashboard />
              </ProtectedRoute>
            } />
            <Route path="md-dashboard" element={
              <ProtectedRoute allowedRoles={['MD']}>
                <MDDashboard />
              </ProtectedRoute>
            } />

            {/* Self-service Pages */}
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="holidays" element={<HolidayCalendar />} />
            <Route path="leaves" element={<Leave />} />
            <Route path="messages" element={<Messages />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calls" element={<Calls />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="exams" element={<Exams />} />
            
            {/* Registration legacy mappings */}
            <Route path="register" element={<Register />} />
            <Route path="manager-register" element={<Register />} />
            <Route path="teamlead-register" element={<Register />} />
            <Route path="employee-register" element={<Register />} />

            {/* Member List legacy mappings */}
            <Route path="hr-list" element={<HRDashboard />} />
            <Route path="manager-list" element={<ManagerDashboard />} />
            <Route path="tl-list" element={<TLDashboard />} />
            <Route path="employee-list" element={<EmployeeDashboard />} />
            <Route path="employees" element={<EmployeeDashboard />} />
            <Route path="all-member" element={<MDDashboard />} />

            {/* Leaves legacy mappings */}
            <Route path="leave-dashboard" element={<Leave />} />
            <Route path="apply-leave" element={<Leave />} />
            <Route path="leave-status" element={<Leave />} />
            <Route path="all-leaves" element={<Leave />} />
            <Route path="hr-approved-leaves" element={<Leave />} />
            <Route path="manager-approved-leaves" element={<Leave />} />
            <Route path="tl-approved-leaves" element={<Leave />} />
            <Route path="leave-requests" element={<Leave />} />

            {/* Projects / Tasks legacy mappings */}
            <Route path="project-dashboard" element={<Tasks />} />
            <Route path="projects" element={<Tasks />} />
            <Route path="assign-task" element={<Tasks />} />
            <Route path="assign-project" element={<Tasks />} />
            <Route path="reports-submit" element={<Tasks />} />
            <Route path="reports-list" element={<Tasks />} />

            {/* Attendance legacy mappings */}
            <Route path="attendance-list" element={<Attendance />} />
            <Route path="monthly-attendance" element={<Attendance />} />
            <Route path="attendance-approvals" element={<Attendance />} />
            <Route path="attendance-correct" element={<Attendance />} />
            <Route path="attendance-correct-bulk" element={<Attendance />} />

            {/* Finance & Invoicing legacy mappings */}
            <Route path="client-create" element={<Invoices />} />
            <Route path="service-create" element={<Invoices />} />
            <Route path="invoice-create" element={<Invoices />} />

            {/* Salary & Payroll legacy mappings */}
            <Route path="salary-structures" element={<Payroll />} />
            <Route path="payslips-list" element={<Payslips />} />

            {/* Exams legacy mappings */}
            <Route path="questions" element={<Exams />} />
          </Route>

          {/* Catch-all redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
