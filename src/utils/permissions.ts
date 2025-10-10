import { UserRole } from '../types';

export type Permission = 'create' | 'read' | 'update' | 'delete' | 'export' | 'settings' | 'backup' | 'logs' | 'configuration';

export interface RolePermissions {
  users: Permission[];
  assets: Permission[];
  approvals: Permission[];
  reports: Permission[];
  system: Permission[];
  documents: Permission[];
  vendors: Permission[];
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    users: ['create', 'read', 'update', 'delete'],
    assets: ['create', 'read', 'update', 'delete'],
    approvals: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'update', 'delete', 'export'],
    system: ['settings', 'backup', 'logs', 'configuration'],
    documents: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete']
  },
  [UserRole.INVENTORY_MANAGER]: {
    users: ['read'], // View only
    assets: ['create', 'read', 'update'], // No delete
    approvals: ['create', 'read', 'update'], // Limited approval types
    reports: ['read', 'export'], // Generate inventory reports
    system: [], // No system admin access
    documents: ['create', 'read', 'update'],
    vendors: ['create', 'read', 'update', 'delete']
  },
  [UserRole.AUDITOR]: {
    users: ['read'],
    assets: ['read'],
    approvals: ['read'],
    reports: ['read', 'export'],
    system: ['logs'],
    documents: ['read'],
    vendors: ['read']
  },
  [UserRole.EMPLOYEE]: {
    users: [], // No user management
    assets: ['read'], // Own assets only
    approvals: ['create', 'read'], // Own requests only
    reports: [], // No report access
    system: [], // No system access
    documents: ['read'], // View own documents only
    vendors: ['read'] // View vendor info only
  }
};

export const hasPermission = (
  userRole: UserRole,
  resource: keyof RolePermissions,
  permission: Permission
): boolean => {
  const permissions = rolePermissions[userRole];
  return permissions[resource].includes(permission);
};

export const getUserPermissions = (userRole: UserRole): RolePermissions => {
  return rolePermissions[userRole];
};