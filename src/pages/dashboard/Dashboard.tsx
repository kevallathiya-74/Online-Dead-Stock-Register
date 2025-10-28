import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import AdminDashboard from './AdminDashboard';
import InventoryManagerDashboard from './InventoryManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import AuditorDashboard from '../auditor/AuditorDashboard';
import VendorDashboard from '../vendor/VendorDashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const Dashboard = () => {
  const { user, loading } = useAuth();

  console.log('Dashboard component rendering - User:', user);
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  // If no user, this shouldn't happen due to ProtectedRoute, but handle it anyway
  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography variant="h6" color="error">
          No user found. Please log in.
        </Typography>
      </Box>
    );
  }
  
  const currentUserRole = user.role;
  
  console.log('Dashboard - Current user role:', currentUserRole);
  console.log('Dashboard - User details:', { name: user.name, email: user.email, department: user.department });
  
  // Lazy-load Documents and render role-specific dashboard alongside it
  const Documents = lazy(() => import('../documents/Documents'));

  // Render role-specific dashboard into a variable so we can render Documents alongside
  let roleComponent: React.ReactElement | null = null;
  switch (currentUserRole) {
    case UserRole.ADMIN:
      console.log('Rendering AdminDashboard');
      roleComponent = <AdminDashboard />;
      break;

    case UserRole.INVENTORY_MANAGER:
      console.log('Rendering InventoryManagerDashboard');
      roleComponent = <InventoryManagerDashboard />;
      break;

    case UserRole.EMPLOYEE:
      console.log('Rendering EmployeeDashboard');
      roleComponent = <EmployeeDashboard />;
      break;

    case UserRole.AUDITOR:
      console.log('Rendering AuditorDashboard');
      roleComponent = <AuditorDashboard />;
      break;

    case UserRole.VENDOR:
      console.log('Rendering VendorDashboard');
      roleComponent = <VendorDashboard />;
      break;

    default:
      console.warn('Unknown role:', currentUserRole, '- Defaulting to EmployeeDashboard');
      roleComponent = <EmployeeDashboard />;
      break;
  }


  return roleComponent;
};

export default Dashboard;