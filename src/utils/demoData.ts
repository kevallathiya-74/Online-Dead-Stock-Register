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
  {
    id: 'demo-user-4',
    username: 'Audit Manager',
    email: 'auditor@company.com',
    password: 'Auditor@123',
    role: UserRole.AUDITOR,
    department: 'Audit',
    employee_id: 'EMP004',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const initializeDemoData = () => {
  // Force refresh demo users to ensure they match current structure
  localStorage.setItem('demo_users', JSON.stringify(demoUsers));
  console.log('Demo users initialized/refreshed:', demoUsers.length, 'users');
  
  // Log each user for debugging
  demoUsers.forEach((user, index) => {
    console.log(`Demo user ${index + 1}:`, user.email, '-', user.role);
  });
};