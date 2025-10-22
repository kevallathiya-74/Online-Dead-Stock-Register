import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { theme } from './config/theme';
import { UserRole } from './types';

// Auth Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminRegister from './pages/auth/AdminRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Documents Pages
import Documents from './pages/documents/Documents';

// Admin Pages
import UsersPage from './pages/users/UsersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssetPage from './pages/admin/AdminAssetPage';
import AdminTransactionPage from './pages/admin/AdminTransactionPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import AdminSystemSettingsPage from './pages/admin/AdminSystemSettingsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminCustomReportsPage from './pages/admin/AdminCustomReportsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAddUserPage from './pages/admin/AdminAddUserPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminBackupPage from './pages/admin/AdminBackupPage';

// Inventory Manager Pages
import AssetsPage from './pages/assets/AssetsPage';
import VendorsPage from './pages/vendors/VendorsPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import ReportsPage from './pages/reports/ReportsPage';
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage';
import LocationsPage from './pages/locations/LocationsPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';

// Employee Pages
import MyAssetsPage from './pages/employee/MyAssetsPage';
import RequestsPage from './pages/employee/RequestsPage';
import ProfilePage from './pages/employee/ProfilePage';
import HistoryPage from './pages/employee/HistoryPage';
import HelpPage from './pages/employee/HelpPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
            </Route>
              
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/assets" element={<AdminAssetPage />} />
              <Route path="/admin/transactions" element={<AdminTransactionPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/analytics/reports" element={<AdminReportsPage />} />
              <Route path="/admin/analytics/custom" element={<AdminCustomReportsPage />} />
              <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
              <Route path="/admin/backups" element={<AdminBackupPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/add" element={<AdminAddUserPage />} />
              <Route path="/admin/documents" element={<AdminDocumentsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/*" element={<UsersPage />} />
            </Route>
              
            {/* Inventory Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]} />}>
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/*" element={<AssetsPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/*" element={<VendorsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/maintenance/*" element={<MaintenancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/*" element={<ReportsPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/*" element={<PurchaseOrdersPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/*" element={<LocationsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/approvals/*" element={<ApprovalsPage />} />
            </Route>

            {/* Employee Routes - Available to all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/employee/my-assets" element={<MyAssetsPage />} />
              <Route path="/employee/requests" element={<RequestsPage />} />
              <Route path="/employee/profile" element={<ProfilePage />} />
              <Route path="/employee/history" element={<HistoryPage />} />
              <Route path="/employee/help" element={<HelpPage />} />
            </Route>

            {/* Default Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        
        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
