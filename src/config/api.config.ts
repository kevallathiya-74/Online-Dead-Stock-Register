// Determine the API base URL
// Priority: Environment variable > Use Vite proxy (relative URLs)
const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is set in .env, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In development, use relative URL to leverage Vite proxy
  // Proxy configured in vite.config.ts forwards /api/* to http://localhost:5000
  const url = '/api/v1';
  return url;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Asset endpoints
  ASSETS: '/assets',
  ASSET_BY_ID: (id: string) => `/assets/${id}`,
  ASSET_HISTORY: (id: string) => `/assets/${id}/history`,
  ASSET_QR: (id: string) => `/assets/${id}/qr`,

  // User endpoints
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_PROFILE: '/users/profile',

  // Vendor endpoints
  VENDORS: '/vendors',
  VENDOR_BY_ID: (id: string) => `/vendors/${id}`,

  // Approval endpoints
  APPROVALS: '/approvals',
  APPROVAL_BY_ID: (id: string) => `/approvals/${id}`,

  // Document endpoints
  DOCUMENTS: '/documents',
  DOCUMENT_BY_ID: (id: string) => `/documents/${id}`,

  // Maintenance endpoints
  MAINTENANCE: '/maintenance',
  MAINTENANCE_BY_ID: (id: string) => `/maintenance/${id}`,

  // Transaction endpoints
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id: string) => `/transactions/${id}`,

  // Report endpoints
  REPORTS: '/reports',
  ANALYTICS: '/analytics',

  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ADMIN_STATS: '/dashboard/stats',
    INVENTORY_STATS: '/dashboard/inventory-stats',
    AUDITOR_STATS: '/dashboard/auditor/stats',
    EMPLOYEE_STATS: '/dashboard/employee/stats',
    ASSETS_LOCATION: '/dashboard/assets-by-location',
    WARRANTY_EXPIRING: '/dashboard/warranty-expiring',
    MAINTENANCE_SCHEDULE: '/dashboard/maintenance-schedule',
    TOP_VENDORS: '/dashboard/top-vendors',
    INVENTORY_APPROVALS: '/dashboard/inventory-approvals',
    USER_ASSETS: (userId: string) => `/dashboard/user-assets/${userId}`,
    AUDIT_ITEMS: '/dashboard/auditor/audit-items',
    CHART_DATA: (type: string) => `/dashboard/chart-data/${type}`,
    REALTIME_UPDATES: '/dashboard/realtime-updates'
  }
};