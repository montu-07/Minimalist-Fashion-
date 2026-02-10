import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Simple admin guard with hardcoded Admin ID requirement.
// Note: For production, replace this client-side check with a secure server-side auth flow.
export default function RequireAdmin({ children }) {
  const location = useLocation();
  const REQUIRED_ADMIN_ID = 'ADMIN-2025-SECURE';
  const adminId = localStorage.getItem('adminId');
  const isAdmin = adminId === REQUIRED_ADMIN_ID;

  if (!isAdmin) {
    return <Navigate to="/access-denied" replace state={{ from: location }} />;
  }
  return children;
}
