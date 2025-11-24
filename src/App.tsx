import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { theme } from './config/theme';
import { UserRole } from './types';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Pages (keep these eagerly loaded for faster initial auth experience)
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded pages for code splitting

// Admin Pages
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAssetPage = lazy(() => import('./pages/admin/AdminAssetPage'));
const AdminTransactionPage = lazy(() => import('./pages/admin/AdminTransactionPage'));
const AdminAuditLogPage = lazy(() => import('./pages/admin/AdminAuditLogPage'));
const AdminSystemSettingsPage = lazy(() => import('./pages/admin/AdminSystemSettingsPage'));
const LifecycleManagementPage = lazy(() => import('./pages/admin/LifecycleManagementPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AdminCustomReportsPage = lazy(() => import('./pages/admin/AdminCustomReportsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAddUserPage = lazy(() => import('./pages/admin/AdminAddUserPage'));
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'));
const AdminBackupPage = lazy(() => import('./pages/admin/AdminBackupPage'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));

// Inventory Manager Pages
const AssetsPage = lazy(() => import('./pages/assets/AssetsPage'));
const AddAssetPage = lazy(() => import('./pages/assets/AddAssetPage'));
const AssetDetailsPage = lazy(() => import('./pages/assets/AssetDetailsPage'));
const QRScannerPage = lazy(() => import('./pages/assets/QRScannerPage'));
const AssetTransfersPage = lazy(() => import('./pages/assets/AssetTransfersPage'));
const AssetLabelsPage = lazy(() => import('./pages/assets/AssetLabelsPage'));
const BulkImportPage = lazy(() => import('./pages/assets/BulkImportPage'));
const CategoriesPage = lazy(() => import('./pages/assets/CategoriesPage'));
const VendorsPage = lazy(() => import('./pages/vendors/VendorsPage'));
const MaintenancePage = lazy(() => import('./pages/maintenance/MaintenancePage'));
const WarrantyPage = lazy(() => import('./pages/maintenance/WarrantyPage'));
const ScrapPage = lazy(() => import('./pages/maintenance/ScrapPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/purchase-orders/PurchaseOrdersPage'));
const InvoicesPage = lazy(() => import('./pages/purchase-orders/InvoicesPage'));
const LocationsPage = lazy(() => import('./pages/locations/LocationsPage'));
const ApprovalsPage = lazy(() => import('./pages/approvals/ApprovalsPage'));
const InventoryManagerProfilePage = lazy(() => import('./pages/inventory/InventoryManagerProfilePage'));

// Inventory/Dead Stock Pages
const DeadStockItemsPage = lazy(() => import('./pages/inventory/DeadStockItemsPage'));
const DisposalRecordsPage = lazy(() => import('./pages/inventory/DisposalRecordsPage'));

// Auditor Pages
const AuditorDashboard = lazy(() => import('./pages/auditor/AuditorDashboard'));
const AuditListPage = lazy(() => import('./pages/auditor/AuditListPage'));
const CompliancePage = lazy(() => import('./pages/auditor/CompliancePage'));
const AuditorProfilePage = lazy(() => import('./pages/auditor/AuditorProfilePage'));

// Vendor Pages
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorOrdersPage = lazy(() => import('./pages/vendor/VendorOrdersPage'));
const VendorProductsPage = lazy(() => import('./pages/vendor/VendorProductsPage'));
const VendorInvoicesPage = lazy(() => import('./pages/vendor/VendorInvoicesPage'));
const VendorProfilePage = lazy(() => import('./pages/vendor/VendorProfilePage'));

// Generic Profile Page
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage'));

// Debug Panel (only in development)
import DebugPanel from './components/debug/DebugPanel';

const App = () => {
  // Only show debug panel in development or when explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = isDevelopment || localStorage.getItem('debug_mode') === 'true';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected Routes - Common to all authenticated users */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  <Route path="/profile" element={<UserProfilePage />} />
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
              <Route path="/admin/lifecycle" element={<LifecycleManagementPage />} />
              <Route path="/admin/backups" element={<AdminBackupPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/add" element={<AdminAddUserPage />} />
              <Route path="/admin/documents" element={<AdminDocumentsPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/*" element={<UsersPage />} />
            </Route>
              
            {/* Inventory Manager Routes - ADMIN, INVENTORY_MANAGER, and IT_MANAGER */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER]} />}>
              <Route path="/inventory-manager/profile" element={<InventoryManagerProfilePage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/add" element={<AddAssetPage />} />
              <Route path="/assets/scan-qr" element={<QRScannerPage />} />
              <Route path="/assets/:id" element={<AssetDetailsPage />} />
              <Route path="/assets/categories" element={<CategoriesPage />} />
              <Route path="/assets/transfers" element={<AssetTransfersPage />} />
              <Route path="/assets/labels" element={<AssetLabelsPage />} />
              <Route path="/assets/import" element={<BulkImportPage />} />
              <Route path="/assets/maintenance" element={<MaintenancePage />} />
              <Route path="/inventory/dead-stock" element={<DeadStockItemsPage />} />
              <Route path="/inventory/disposal" element={<DisposalRecordsPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/*" element={<VendorsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/maintenance/warranty" element={<WarrantyPage />} />
              <Route path="/maintenance/scrap" element={<ScrapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/*" element={<ReportsPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/invoices" element={<InvoicesPage />} />
              <Route path="/purchase-orders/*" element={<PurchaseOrdersPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/*" element={<LocationsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/approvals/*" element={<ApprovalsPage />} />
            </Route>

            {/* Auditor Routes - AUDITOR role only */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.AUDITOR]} />}>
              <Route path="/auditor" element={<AuditorDashboard />} />
              <Route path="/auditor/profile" element={<AuditorProfilePage />} />
              <Route path="/auditor/dashboard" element={<AuditorDashboard />} />
              <Route path="/auditor/audit-list" element={<AuditListPage />} />
              <Route path="/auditor/compliance" element={<CompliancePage />} />
              <Route path="/auditor/reports" element={<ReportsPage />} />
            </Route>

            {/* Vendor Routes - VENDOR role only */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.VENDOR]} />}>
              <Route path="/vendor" element={<VendorDashboard />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/orders" element={<VendorOrdersPage />} />
              <Route path="/vendor/products" element={<VendorProductsPage />} />
              <Route path="/vendor/invoices" element={<VendorInvoicesPage />} />
              <Route path="/vendor/profile" element={<VendorProfilePage />} />
            </Route>

            {/* Default Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
        
        {/* Debug Panel - Development Only */}
        {debugEnabled && <DebugPanel enableQRDebug={true} />}
        
        {/* Toast Container for notifications - Optimized configuration */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={3}
          theme="light"
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
