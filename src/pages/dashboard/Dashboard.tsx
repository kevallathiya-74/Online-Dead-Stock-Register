import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import AuditorDashboard from './AuditorDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // DEMO MODE: For demonstration purposes, use AUDITOR role if no user
  const currentUserRole = user?.role || UserRole.AUDITOR;
  
  switch (currentUserRole) {
    case UserRole.ADMIN:
      return <AuditorDashboard />; // Temporary - use Auditor dashboard for Admin
    case UserRole.INVENTORY_MANAGER:
      return <AuditorDashboard />; // Temporary - use Auditor dashboard
    case UserRole.AUDITOR:
      return <AuditorDashboard />;
    case UserRole.EMPLOYEE:
      return <EmployeeDashboard />;
    default:
      return <AuditorDashboard />; // Default to Auditor dashboard for demo
  }
};

export default Dashboard;