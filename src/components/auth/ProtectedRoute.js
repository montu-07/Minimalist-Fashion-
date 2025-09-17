import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'state/AuthContext';

/**
 * A protected route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} [props.redirectTo] - Path to redirect to if not authenticated (default: '/login')
 * @param {boolean} [props.requireAdmin] - If true, only allows admin users
 * @returns {React.ReactNode} - Rendered component or redirect
 */
const ProtectedRoute = ({ 
  children, 
  redirectTo = '/login',
  requireAdmin = false 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If authenticated and has required role, render children
  return children;
};

export default ProtectedRoute;
