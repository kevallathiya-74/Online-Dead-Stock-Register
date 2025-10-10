import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import AdminDashboard from './AdminDashboard';
import InventoryManagerDashboard from './InventoryManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import AuditorDashboard from './AuditorDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  console.log('Dashboard component rendering - User:', user);
  
  // DEMO MODE: For demonstration purposes, use EMPLOYEE role if no user
  const currentUserRole = user?.role || UserRole.EMPLOYEE;
  
  console.log('Dashboard - Current user role:', currentUserRole);
  
  switch (currentUserRole) {
    case UserRole.ADMIN:
      console.log('Rendering AdminDashboard');
      return <AdminDashboard />;
    case UserRole.INVENTORY_MANAGER:
      console.log('Rendering InventoryManagerDashboard');
      return <InventoryManagerDashboard />;
    case UserRole.AUDITOR:
      console.log('Rendering AuditorDashboard');
      return <AuditorDashboard />;
    case UserRole.EMPLOYEE:
      console.log('Rendering EmployeeDashboard');
      return <EmployeeDashboard />;
    default:
      console.log('Rendering default EmployeeDashboard');
      return <EmployeeDashboard />; // Default to Employee dashboard for demo
  }
};

export default Dashboard;