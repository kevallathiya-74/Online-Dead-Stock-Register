import { UserRole } from '../types';

export const demoUsers = [
  {
    id: 'demo-user-1',
    username: 'System Administrator',
    email: 'admin@company.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    department: 'IT',
    employee_id: 'EMP001',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-2',
    username: 'Inventory Manager',
    email: 'inventory@company.com',
    password: 'Inventory@123',
    role: UserRole.INVENTORY_MANAGER,
    department: 'IT',
    employee_id: 'EMP002',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-3',
    username: 'John Employee',
    email: 'employee@company.com',
    password: 'Employee@123',
    role: UserRole.EMPLOYEE,
    department: 'IT',
    employee_id: 'EMP003',
    is_active: true,
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