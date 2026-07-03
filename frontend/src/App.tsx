import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loading from './components/common/Loading';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';
import { cleanupSession, initializeSession } from './utils/sessionManagement';

// Auth Pages (eagerly loaded for fast initial auth experience)
import ForgotPassword from './features/auth/pages/ForgotPassword';
import Landing from './features/auth/pages/Landing';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ResetPassword from './features/auth/pages/ResetPassword';

// Dashboard Pages
import Dashboard from './features/dashboard/pages/Dashboard';

// Protected Route Component
import ProtectedRoute from './features/auth/components/ProtectedRoute';

// Lazy-loaded pages for code splitting

// Admin Pages
const UsersPage = lazy(() => import('./features/users/pages/UsersPage'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const AdminTransactionPage = lazy(() => import('./features/admin/pages/AdminTransactionPage'));
const AdminAuditLogPage = lazy(() => import('./features/admin/pages/AdminAuditLogPage'));
const AdminSystemSettingsPage = lazy(() => import('./features/admin/pages/AdminSystemSettingsPage'));
const LifecycleManagementPage = lazy(() => import('./features/admin/pages/LifecycleManagementPage'));
const AdminAnalyticsPage = lazy(() => import('./features/admin/pages/AdminAnalyticsPage'));
const AdminReportsPage = lazy(() => import('./features/admin/pages/AdminReportsPage'));
const AdminCustomReportsPage = lazy(() => import('./features/admin/pages/AdminCustomReportsPage'));
const AdminAddUserPage = lazy(() => import('./features/users/pages/AdminAddUserPage'));
const AdminBackupPage = lazy(() => import('./features/admin/pages/AdminBackupPage'));

// Inventory Manager Pages
const AssetsPage = lazy(() => import('./features/assets/pages/AssetsPage'));
const AddAssetPage = lazy(() => import('./features/assets/pages/AddAssetPage'));
const AssetDetailsPage = lazy(() => import('./features/assets/pages/AssetDetailsPage'));
const QRScannerPage = lazy(() => import('./features/assets/pages/QRScannerPage'));
const AssetTransfersPage = lazy(() => import('./features/assets/pages/AssetTransfersPage'));
const AssetLabelsPage = lazy(() => import('./features/assets/pages/AssetLabelsPage'));
const BulkImportPage = lazy(() => import('./features/assets/pages/BulkImportPage'));
const CategoriesPage = lazy(() => import('./features/assets/pages/CategoriesPage'));
const VendorsPage = lazy(() => import('./features/vendors/pages/VendorsPage'));
const MaintenancePage = lazy(() => import('./features/maintenance/pages/MaintenancePage'));
const WarrantyPage = lazy(() => import('./features/maintenance/pages/WarrantyPage'));
const ScrapPage = lazy(() => import('./features/maintenance/pages/ScrapPage'));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage'));
const PurchaseOrdersPage = lazy(() => import('./features/purchasing/pages/PurchaseOrdersPage'));
const InvoicesPage = lazy(() => import('./features/purchasing/pages/InvoicesPage'));
const LocationsPage = lazy(() => import('./features/inventory/pages/LocationsPage'));
const ApprovalsPage = lazy(() => import('./features/approvals/pages/ApprovalsPage'));

// Inventory/Dead Stock Pages
const DeadStockItemsPage = lazy(() => import('./features/inventory/pages/DeadStockItemsPage'));
const DisposalRecordsPage = lazy(() => import('./features/inventory/pages/DisposalRecordsPage'));

// Auditor Pages
const AuditorDashboard = lazy(() => import('./features/auditing/pages/AuditorDashboard'));
const AuditListPage = lazy(() => import('./features/auditing/pages/AuditListPage'));
const CompliancePage = lazy(() => import('./features/auditing/pages/CompliancePage'));

// Vendor Pages
const VendorDashboard = lazy(() => import('./features/vendor-portal/pages/VendorDashboard'));
const VendorOrdersPage = lazy(() => import('./features/vendor-portal/pages/VendorOrdersPage'));
const VendorProductsPage = lazy(() => import('./features/vendor-portal/pages/VendorProductsPage'));
const VendorInvoicesPage = lazy(() => import('./features/vendor-portal/pages/VendorInvoicesPage'));

// Generic Pages
const UserProfilePage = lazy(() => import('./features/users/pages/UserProfilePage'));
const Documents = lazy(() => import('./features/documents/pages/Documents'));

// Debug Panel (only in development)
import DebugPanel from './components/debug/DebugPanel';

const AppContent = () => {
  const { user } = useAuth();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = isDevelopment || localStorage.getItem('debug_mode') === 'true';

  // Initialize session management reactively on login/logout
  useEffect(() => {
    if (user) {
      initializeSession();
    } else {
      cleanupSession();
    }

    return () => cleanupSession();
  }, [user]);

  return (
    <>
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
              <Route path="/admin/assets" element={<AssetsPage />} />
              <Route path="/admin/transactions" element={<AdminTransactionPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/analytics/reports" element={<AdminReportsPage />} />
              <Route path="/admin/analytics/custom" element={<AdminCustomReportsPage />} />
              <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
              <Route path="/admin/lifecycle" element={<LifecycleManagementPage />} />
              <Route path="/admin/backups" element={<AdminBackupPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/add" element={<AdminAddUserPage />} />
              <Route path="/admin/documents" element={<Documents />} />
              <Route path="/admin/profile" element={<UserProfilePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/*" element={<UsersPage />} />
            </Route>

            {/* Inventory Manager Routes - ADMIN, INVENTORY_MANAGER, and IT_MANAGER */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER]} />}>
              <Route path="/inventory-manager/profile" element={<UserProfilePage />} />
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
              <Route path="/auditor/profile" element={<UserProfilePage />} />
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
              <Route path="/vendor/profile" element={<UserProfilePage />} />
            </Route>

            {/* Default Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>

      {/* Debug Panel - Development Only */}
      {debugEnabled && <DebugPanel enableQRDebug={true} />}
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Analytics />
        {/* Toast notifications */}
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
          toastClassName="!rounded-xl !font-sans !text-sm !shadow-card-lg"
        />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
