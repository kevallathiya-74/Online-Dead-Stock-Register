import { UserRole } from '../types';

export const demoUsers = [
  {
    id: 'demo-user-1',
    username: 'Admin User',
    email: 'admin@demo.com',
    role: UserRole.ADMIN,
    department: 'Administration',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-2',
    username: 'Inventory Manager',
    email: 'manager@demo.com',
    role: UserRole.INVENTORY_MANAGER,
    department: 'Operations',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-3',
    username: 'Auditor User',
    email: 'auditor@demo.com',
    role: UserRole.AUDITOR,
    department: 'Finance',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-4',
    username: 'Employee User',
    email: 'employee@demo.com',
    role: UserRole.EMPLOYEE,
    department: 'IT',
    created_at: new Date().toISOString(),
  },
];

export const initializeDemoData = () => {
  // Check if demo users already exist
  const existingUsers = localStorage.getItem('demo_users');
  if (!existingUsers) {
    localStorage.setItem('demo_users', JSON.stringify(demoUsers));
    console.log('Demo users initialized');
  }
};