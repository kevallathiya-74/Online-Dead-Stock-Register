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
    users: ['read'], 
    assets: ['create', 'read', 'update'], 
    approvals: ['create', 'read', 'update'],
    reports: ['read', 'export'],
    system: [], 
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
    users: [], 
    assets: ['read'], 
    approvals: ['create', 'read'], 
    reports: [], 
    system: [], 
    documents: ['read'], 
    vendors: ['read'] 
  },
  [UserRole.IT_MANAGER]: {
    users: ['read'], 
    assets: ['create', 'read', 'update', 'delete'], 
    approvals: ['create', 'read', 'update'],
    reports: ['read', 'export'],
    system: ['settings', 'logs'], 
    documents: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete']
  },
  [UserRole.VENDOR]: {
    users: [],
    assets: ['read'], 
    approvals: [],
    reports: [],
    system: [],
    documents: ['read'], 
    vendors: ['read'] 
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