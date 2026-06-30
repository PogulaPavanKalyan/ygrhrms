import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif',
        color: '#64748b'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#3b82f6', marginBottom: '1rem' }}></i>
          <div>Loading HRMS Portal...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this role path, redirect to their default landing dashboard
    const roleRedirects = {
      Employee: '/employee-dashboard',
      TeamLead: '/tl-dashboard',
      Manager: '/manager-dashboard',
      HR: '/hr-dashboard',
      MD: '/md-dashboard',
    };
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
