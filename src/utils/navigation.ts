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
    title: 'User Management',
    path: '/admin/users',
    icon: PeopleIcon,
    children: [
      { id: 'all-users', title: 'All Users', path: '/admin/users', icon: PeopleIcon },
      { id: 'add-user', title: 'Add User', path: '/admin/users/add', icon: PeopleIcon },
    ],
  },
  {
    id: 'assets',
    title: 'Asset Management',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'all-assets', title: 'All Assets', path: '/assets', icon: InventoryIcon },
      { id: 'add-asset', title: 'Add Asset', path: '/assets/add', icon: InventoryIcon },
      { id: 'categories', title: 'Categories', path: '/assets/categories', icon: InventoryIcon },
    ],
  },
  {
    id: 'inventory',
    title: 'Dead Stock',
    path: '/inventory',
    icon: InventoryIcon,
    children: [
      { id: 'dead-stock', title: 'Dead Stock Items', path: '/inventory/dead-stock', icon: InventoryIcon },
      { id: 'disposal', title: 'Disposal Records', path: '/inventory/disposal', icon: InventoryIcon },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    path: '/admin/reports',
    icon: AnalyticsIcon,
    children: [
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports/assets', icon: ReportIcon },
      { id: 'disposal-reports', title: 'Disposal Reports', path: '/reports/disposal', icon: ReportIcon },
      { id: 'audit-logs', title: 'Audit Logs', path: '/admin/audit-logs', icon: HistoryIcon },
    ],
  },
  {
    id: 'settings',
    title: 'System Settings',
    path: '/admin/settings',
    icon: SettingsIcon,
  }
];

export const inventoryManagerNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'inventory',
    title: 'Dead Stock Management',
    path: '/inventory',
    icon: InventoryIcon,
    children: [
      { id: 'dead-stock', title: 'Dead Stock Items', path: '/inventory/dead-stock', icon: InventoryIcon },
      { id: 'add-item', title: 'Add Dead Stock', path: '/inventory/add', icon: InventoryIcon },
      { id: 'disposal', title: 'Disposal Records', path: '/inventory/disposal', icon: InventoryIcon },
    ],
  },
  {
    id: 'assets',
    title: 'Assets',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'all-assets', title: 'View Assets', path: '/assets', icon: InventoryIcon },
      { id: 'maintenance', title: 'Maintenance', path: '/assets/maintenance', icon: MaintenanceIcon },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: ReportIcon,
    children: [
      { id: 'inventory-reports', title: 'Inventory Reports', path: '/reports/inventory', icon: ReportIcon },
      { id: 'disposal-reports', title: 'Disposal Reports', path: '/reports/disposal', icon: ReportIcon },
    ],
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
    id: 'assets',
    title: 'Dead Stock Items',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'view-items', title: 'View Items', path: '/assets/view', icon: InventoryIcon },
      { id: 'my-items', title: 'My Items', path: '/assets/my-items', icon: InventoryIcon },
    ]
  },
  {
    id: 'requests',
    title: 'Requests',
    path: '/requests',
    icon: RequestIcon,
    children: [
      { id: 'new-request', title: 'New Request', path: '/requests/new', icon: RequestIcon },
      { id: 'my-requests', title: 'My Requests', path: '/requests', icon: RequestIcon },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/profile',
    icon: ProfileIcon,
  }
];

export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.EMPLOYEE:
      return employeeNavigation;
    default:
      return employeeNavigation;
  }
};