import React from 'react';
import { Outlet } from 'react-router-dom';

import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute = ({ 
  allowedRoles, 
  redirectPath = '/login' 
}: ProtectedRouteProps) => {
  // TEMPORARY: For demo purposes, bypass authentication
  // This allows us to demonstrate the dashboard functionality
  return <Outlet />;
};

export default ProtectedRoute;