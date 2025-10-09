import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  redirectPath = '/login' 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    // Save the attempted location for redirect after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  const userRole = user.user_metadata?.role as UserRole;

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;