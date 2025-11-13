import { UserRole } from '../types';
import type { SvgIconComponent } from '@mui/icons-material';
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
  Backup as BackupIcon,
  FactCheck as AuditIcon,
  CheckCircle as ComplianceIcon,
  PlaylistAddCheck as AuditListIcon
} from '@mui/icons-material';

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: SvgIconComponent;
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
    path: '/reports',
    icon: AnalyticsIcon,
    children: [
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports', icon: ReportIcon },
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
    id: 'assets',
    title: 'Asset Management',
    path: '/assets',
    icon: InventoryIcon,
    children: [
      { id: 'all-assets', title: 'View Assets', path: '/assets', icon: InventoryIcon },
      { id: 'add-asset', title: 'Add Asset', path: '/assets/add', icon: InventoryIcon },
      { id: 'transfers', title: 'Transfers', path: '/assets/transfers', icon: InventoryIcon },
      { id: 'labels', title: 'Labels', path: '/assets/labels', icon: InventoryIcon },
      { id: 'bulk-import', title: 'Bulk Import', path: '/assets/import', icon: InventoryIcon },
      { id: 'maintenance', title: 'Maintenance', path: '/assets/maintenance', icon: MaintenanceIcon },
    ],
  },
  {
    id: 'purchases',
    title: 'Purchase Orders',
    path: '/purchase-orders',
    icon: PurchaseIcon,
    children: [
      { id: 'orders', title: 'Orders', path: '/purchase-orders', icon: PurchaseIcon },
      { id: 'vendors', title: 'Vendors', path: '/vendors', icon: VendorIcon },
      { id: 'invoices', title: 'Invoices', path: '/purchase-orders/invoices', icon: DocumentIcon },
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
      { id: 'scrap', title: 'Scrap Management', path: '/maintenance/scrap', icon: MaintenanceIcon },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: ReportIcon,
    children: [
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports', icon: InventoryIcon },
    ],
  },
  {
    id: 'approvals',
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
    path: '/employee/my-assets',
    icon: InventoryIcon,
  },
  {
    id: 'requests',
    title: 'My Requests',
    path: '/employee/requests',
    icon: RequestIcon,
    children: [
      { id: 'new-request', title: 'New Request', path: '/employee/requests/new', icon: RequestIcon },
      { id: 'my-requests', title: 'View Requests', path: '/employee/requests', icon: RequestIcon },
    ],
  },
  {
    id: 'profile',
    title: 'My Profile',
    path: '/employee/profile',
    icon: ProfileIcon,
  },
  {
    id: 'help',
    title: 'Help & Support',
    path: '/employee/help',
    icon: HelpIcon,
  },
];

export const auditorNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/auditor/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'audit-list',
    title: 'Audit List',
    path: '/auditor/audit-list',
    icon: AuditListIcon,
  },
  {
    id: 'compliance',
    title: 'Compliance Metrics',
    path: '/auditor/compliance',
    icon: ComplianceIcon,
  },
  {
    id: 'reports',
    title: 'Audit Reports',
    path: '/auditor/reports',
    icon: ReportIcon,
  },
  {
    id: 'help',
    title: 'Help & Support',
    path: '/employee/help',
    icon: HelpIcon,
  },
];

export const vendorNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/vendor/dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'orders',
    title: 'My Orders',
    path: '/vendor/orders',
    icon: PurchaseIcon,
  },
  {
    id: 'products',
    title: 'My Products',
    path: '/vendor/products',
    icon: InventoryIcon,
  },
  {
    id: 'invoices',
    title: 'Invoices',
    path: '/vendor/invoices',
    icon: DocumentIcon,
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/vendor/profile',
    icon: ProfileIcon,
  },
  {
    id: 'help',
    title: 'Help & Support',
    path: '/employee/help',
    icon: HelpIcon,
  },
];

export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
    case UserRole.IT_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.EMPLOYEE:
      return employeeNavigation;
    case UserRole.AUDITOR:
      return auditorNavigation;
    case UserRole.VENDOR:
      return vendorNavigation;
    default:
      return employeeNavigation;
  }
};