import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute = ({ 
  allowedRoles, 
  redirectPath = '/login' 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has required role, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;