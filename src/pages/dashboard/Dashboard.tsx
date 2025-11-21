import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import AdminDashboard from './AdminDashboard';
import InventoryManagerDashboard from './InventoryManagerDashboard';
import AuditorDashboard from '../auditor/AuditorDashboard';
import VendorDashboard from '../vendor/VendorDashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const Dashboard = () => {
  const { user, loading } = useAuth();
  
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
  
  // Lazy-load Documents and render role-specific dashboard alongside it
  const Documents = lazy(() => import('../documents/Documents'));

  // Render role-specific dashboard into a variable so we can render Documents alongside
  let roleComponent: React.ReactElement | null = null;
  switch (currentUserRole) {
    case UserRole.ADMIN:
      roleComponent = <AdminDashboard />;
      break;

    case UserRole.INVENTORY_MANAGER:
      roleComponent = <InventoryManagerDashboard />;
      break;

    case UserRole.IT_MANAGER:
      roleComponent = <InventoryManagerDashboard />;
      break;

    case UserRole.AUDITOR:
      roleComponent = <AuditorDashboard />;
      break;

    case UserRole.VENDOR:
      roleComponent = <VendorDashboard />;
      break;

    default:
      roleComponent = (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Typography variant="h6" color="error">
            Invalid user role. Please contact administrator.
          </Typography>
        </Box>
      );
      break;
  }


  return roleComponent;
};

export default Dashboard;