import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kisan-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure user has verified their email before entering any protected dashboard
  if (user && user.is_verified === false) {
    return (
      <Navigate
        to="/verify-email"
        state={{
          email: user.email,
          role: user.role,
          from: location.pathname
        }}
        replace
      />
    );
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to matching role home
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={role === 'farmer' ? '/farmer' : '/buyer'} replace />;
  }

  return children;
};

export default ProtectedRoute;
