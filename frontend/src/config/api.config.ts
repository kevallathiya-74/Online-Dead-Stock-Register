export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  ANALYTICS: '/analytics'
};