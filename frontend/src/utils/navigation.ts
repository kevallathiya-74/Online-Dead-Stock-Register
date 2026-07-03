import {
    ArchiveBoxIcon,
    ArrowsRightLeftIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ChartPieIcon,
    CheckBadgeIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    CubeIcon,
    DocumentTextIcon,
    HomeIcon,
    ServerStackIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    UserCircleIcon,
    UsersIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import type { FC, SVGProps } from 'react';
import { UserRole } from '../types';

export type HeroIcon = FC<SVGProps<SVGSVGElement> & { title?: string; titleId?: string }>;

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: HeroIcon;
  children?: NavigationItem[];
}

export const adminNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'users',
    title: 'User Management',
    path: '/admin/users',
    icon: UsersIcon,
    children: [
      { id: 'all-users', title: 'All Users',  path: '/admin/users',     icon: UsersIcon },
      { id: 'add-user',  title: 'Add User',   path: '/admin/users/add', icon: UserCircleIcon },
    ],
  },
  {
    id: 'assets',
    title: 'Asset Management',
    path: '/assets',
    icon: CubeIcon,
    children: [
      { id: 'all-assets',  title: 'All Assets',  path: '/assets',            icon: CubeIcon },
      { id: 'add-asset',   title: 'Add Asset',   path: '/assets/add',        icon: CubeIcon },
      { id: 'categories',  title: 'Categories',  path: '/assets/categories', icon: ArchiveBoxIcon },
    ],
  },
  {
    id: 'inventory',
    title: 'Dead Stock',
    path: '/inventory',
    icon: ArchiveBoxIcon,
    children: [
      { id: 'dead-stock', title: 'Dead Stock Items',  path: '/inventory/dead-stock', icon: ArchiveBoxIcon },
      { id: 'disposal',   title: 'Disposal Records',  path: '/inventory/disposal',   icon: DocumentTextIcon },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    path: '/reports',
    icon: ChartBarIcon,
    children: [
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports',           icon: ChartPieIcon },
      { id: 'audit-logs',    title: 'Audit Logs',    path: '/admin/audit-logs', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    id: 'settings',
    title: 'System Settings',
    path: '/admin/settings',
    icon: Cog6ToothIcon,
  },
];

export const inventoryManagerNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'assets',
    title: 'Asset Management',
    path: '/assets',
    icon: CubeIcon,
    children: [
      { id: 'all-assets',  title: 'View Assets', path: '/assets',              icon: CubeIcon },
      { id: 'add-asset',   title: 'Add Asset',   path: '/assets/add',          icon: CubeIcon },
      { id: 'transfers',   title: 'Transfers',   path: '/assets/transfers',    icon: ArrowsRightLeftIcon },
      { id: 'labels',      title: 'Labels',      path: '/assets/labels',       icon: DocumentTextIcon },
      { id: 'bulk-import', title: 'Bulk Import', path: '/assets/import',       icon: ServerStackIcon },
      { id: 'maintenance', title: 'Maintenance', path: '/assets/maintenance',  icon: WrenchScrewdriverIcon },
    ],
  },
  {
    id: 'purchases',
    title: 'Purchase Orders',
    path: '/purchase-orders',
    icon: ShoppingCartIcon,
    children: [
      { id: 'orders',   title: 'Orders',   path: '/purchase-orders',          icon: ShoppingCartIcon },
      { id: 'vendors',  title: 'Vendors',  path: '/vendors',                  icon: BuildingStorefrontIcon },
      { id: 'invoices', title: 'Invoices', path: '/purchase-orders/invoices', icon: DocumentTextIcon },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    path: '/maintenance',
    icon: WrenchScrewdriverIcon,
    children: [
      { id: 'schedule', title: 'Schedule',         path: '/maintenance',         icon: WrenchScrewdriverIcon },
      { id: 'warranty', title: 'Warranty',         path: '/maintenance/warranty',icon: ShieldCheckIcon },
      { id: 'scrap',    title: 'Scrap Management', path: '/maintenance/scrap',   icon: ArchiveBoxIcon },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: ChartBarIcon,
    children: [
      { id: 'asset-reports', title: 'Asset Reports', path: '/reports', icon: ChartPieIcon },
    ],
  },
  {
    id: 'approvals',
    title: 'My Approvals',
    path: '/approvals',
    icon: ClipboardDocumentCheckIcon,
  },
];

export const auditorNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/auditor/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'audit-list',
    title: 'Audit List',
    path: '/auditor/audit-list',
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'compliance',
    title: 'Compliance Metrics',
    path: '/auditor/compliance',
    icon: CheckBadgeIcon,
  },
  {
    id: 'reports',
    title: 'Audit Reports',
    path: '/auditor/reports',
    icon: ChartBarIcon,
  },
];

export const vendorNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'orders',
    title: 'My Orders',
    path: '/vendor/orders',
    icon: ShoppingCartIcon,
  },
  {
    id: 'products',
    title: 'My Products',
    path: '/vendor/products',
    icon: CubeIcon,
  },
  {
    id: 'invoices',
    title: 'Invoices',
    path: '/vendor/invoices',
    icon: DocumentTextIcon,
  },
];

export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
    case UserRole.IT_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.AUDITOR:
      return auditorNavigation;
    case UserRole.VENDOR:
      return vendorNavigation;
    default:
      return [];
  }
};

// Profile navigation — shows full navigation for managers, dashboard-only for others
export const getProfileNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
    case UserRole.IT_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.AUDITOR:
      return [{ id: 'dashboard', title: 'Dashboard', path: '/auditor/dashboard', icon: HomeIcon }];
    case UserRole.VENDOR:
      return [{ id: 'dashboard', title: 'Dashboard', path: '/vendor/dashboard',  icon: HomeIcon }];
    default:
      return [{ id: 'dashboard', title: 'Dashboard', path: '/dashboard',          icon: HomeIcon }];
  }
};