import { UserRole } from '../types';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Approval as ApprovalIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Description as DocumentIcon,
  Store as VendorIcon,
  LocationOn as LocationIcon,
  Build as MaintenanceIcon,
  ShoppingCart as PurchaseIcon,
  Assignment as RequestIcon,
  Person as ProfileIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  Backup as BackupIcon
} from '@mui/icons-material';

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: any;
  children?: NavigationItem[];
}

export const adminNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'users',
    title: 'Users',
    path: '/admin/users',
    icon: PeopleIcon,
    children: [
      { id: 'all-users', title: 'All Users', path: '/admin/users', icon: PeopleIcon },
      { id: 'add-user', title: 'Add User', path: '/admin/users/add', icon: PeopleIcon },
    ],
  },
  {
    id: 'assets',
    title: 'Assets',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'all-assets', title: 'All Assets', path: '/assets', icon: InventoryIcon },
    ],
  },
  {
    id: 'approvals',
    title: 'Approvals',
    path: '/approvals',
    icon: ApprovalIcon,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    path: '/admin/analytics',
    icon: AnalyticsIcon,
    children: [
      { id: 'analytics-dashboard', title: 'Dashboard', path: '/admin/analytics', icon: AnalyticsIcon },
      { id: 'reports', title: 'Reports', path: '/admin/analytics/reports', icon: ReportIcon },
      { id: 'custom-reports', title: 'Custom Reports', path: '/admin/analytics/custom', icon: ReportIcon },
    ],
  },
  {
    id: 'system',
    title: 'System',
    path: '/admin/settings',
    icon: SettingsIcon,
    children: [
      { id: 'settings', title: 'Settings', path: '/admin/settings', icon: SettingsIcon },
      { id: 'audit-logs', title: 'Audit Logs', path: '/admin/audit-logs', icon: HistoryIcon },
      { id: 'backups', title: 'Backups', path: '/admin/backups', icon: BackupIcon },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    path: '/admin/documents',
    icon: DocumentIcon,
  },
];

export const inventoryManagerNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'assets',
    title: 'Assets',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'inventory', title: 'Inventory', path: '/assets', icon: InventoryIcon },
      { id: 'add-asset', title: 'Add Asset', path: '/assets/add', icon: InventoryIcon },
      { id: 'transfers', title: 'Transfers', path: '/assets/transfers', icon: InventoryIcon },
      { id: 'labels', title: 'Labels', path: '/assets/labels', icon: InventoryIcon },
      { id: 'bulk-import', title: 'Bulk Import', path: '/assets/import', icon: InventoryIcon },
    ],
  },
  {
    id: 'purchases',
    title: 'Purchases',
    path: '/purchase-orders',
    icon: PurchaseIcon,
    children: [
      { id: 'orders', title: 'Orders', path: '/purchase-orders', icon: PurchaseIcon },
      { id: 'vendors', title: 'Vendors', path: '/vendors', icon: VendorIcon },
      { id: 'invoices', title: 'Invoices', path: '/purchase-orders/invoices', icon: DocumentIcon },
      { id: 'budget-tracking', title: 'Budget Tracking', path: '/purchase-orders/budget', icon: AnalyticsIcon },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    path: '/maintenance',
    icon: MaintenanceIcon,
    children: [
      { id: 'schedule', title: 'Schedule', path: '/maintenance', icon: MaintenanceIcon },
      { id: 'warranty', title: 'Warranty', path: '/maintenance/warranty', icon: SecurityIcon },
      { id: 'amc', title: 'AMC', path: '/maintenance/amc', icon: MaintenanceIcon },
      { id: 'scrap', title: 'Scrap Management', path: '/maintenance/scrap', icon: MaintenanceIcon },
    ],
  },
  {
    id: 'locations',
    title: 'Locations',
    path: '/locations',
    icon: LocationIcon,
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: ReportIcon,
    children: [
      { id: 'all-reports', title: 'All Reports', path: '/reports', icon: ReportIcon },
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports/assets', icon: InventoryIcon },
      { id: 'maintenance-reports', title: 'Maintenance Reports', path: '/reports/maintenance', icon: MaintenanceIcon },
      { id: 'vendor-reports', title: 'Vendor Reports', path: '/reports/vendors', icon: VendorIcon },
    ],
  },
  {
    id: 'my-approvals',
    title: 'My Approvals',
    path: '/approvals',
    icon: ApprovalIcon,
  },
];

export const employeeNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'my-assets',
    title: 'My Assets',
    path: '/my-assets',
    icon: InventoryIcon,
  },
  {
    id: 'requests',
    title: 'Requests',
    path: '/requests',
    icon: RequestIcon,
    children: [
      { id: 'new-request', title: 'New Request', path: '/requests/new', icon: RequestIcon },
      { id: 'my-requests', title: 'My Requests', path: '/requests', icon: RequestIcon },
      { id: 'request-history', title: 'Request History', path: '/requests/history', icon: HistoryIcon },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/profile',
    icon: ProfileIcon,
  },
  {
    id: 'help',
    title: 'Help',
    path: '/help',
    icon: HelpIcon,
  },
];

export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.EMPLOYEE:
      return employeeNavigation;
    case UserRole.AUDITOR:
      // Auditor gets similar to employee but with read-only access
      return employeeNavigation;
    default:
      return employeeNavigation;
  }
};