/**
 * VENDOR PORTAL SERVICE - Real API Integration
 * 
 * Connected Backend Endpoints:
 * - GET /api/v1/vendor/dashboard/stats - Vendor dashboard statistics
 * - GET /api/v1/vendor/dashboard/recent-orders - Recent 5 orders
 * - GET /api/v1/vendor/orders - All orders with pagination & filters
 * - GET /api/v1/vendor/orders/:id - Single order details
 * - GET /api/v1/vendor/products - Products/assets supplied by vendor
 * - GET /api/v1/vendor/invoices - Vendor invoices list
 * - GET /api/v1/vendor/invoices/:id/download - Download invoice PDF
 * - GET /api/v1/vendor/profile - Vendor profile data
 * - PUT /api/v1/vendor/profile - Update vendor profile
 * 
 * Data Flow: Frontend → Service → Backend Controller → MongoDB
 * Authentication: Bearer token from localStorage ('token' key)
 * Role Access: VENDOR role only (enforced by backend requireRole middleware)
 * 
 * Field Mappings:
 * - Backend returns: totalOrders, pendingOrders, completedOrders, totalRevenue, activeProducts, pendingInvoices, performanceScore
 * - Frontend expects: VendorStats interface with matching fields
 * - Orders: po_number, status, total_amount, expected_delivery_date, order_date, items_count, priority
 */

import axios from 'axios';
import type { 
  VendorStats, 
  VendorOrder, 
  VendorProduct, 
  VendorInvoice, 
  VendorProfile,
  Pagination
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get vendor dashboard statistics
export const getVendorStats = async (): Promise<VendorStats> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/dashboard/stats`, {
    headers: getAuthHeader()
  });
  return response.data.stats;
};

// Get recent orders (5 latest)
export const getRecentOrders = async (): Promise<VendorOrder[]> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/dashboard/recent-orders`, {
    headers: getAuthHeader()
  });
  return response.data.orders;
};

// Get all orders with pagination and filters
export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ orders: VendorOrder[]; pagination: Pagination }> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/orders`, {
    headers: getAuthHeader(),
    params
  });
  return {
    orders: response.data.orders,
    pagination: response.data.pagination
  };
};

// Get single order details
export const getOrderById = async (orderId: string): Promise<VendorOrder> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/orders/${orderId}`, {
    headers: getAuthHeader()
  });
  return response.data.order;
};

// Get products (assets supplied by vendor)
export const getProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<{ products: VendorProduct[]; pagination: Pagination }> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/products`, {
    headers: getAuthHeader(),
    params
  });
  return {
    products: response.data.products,
    pagination: response.data.pagination
  };
};

// Get invoices
export const getInvoices = async (params?: {
  status?: string;
}): Promise<{ invoices: VendorInvoice[]; summary: { total_invoices: number; total_amount: number; pending_amount: number; paid_amount: number } }> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/invoices`, {
    headers: getAuthHeader(),
    params
  });
  return {
    invoices: response.data.invoices,
    summary: response.data.summary
  };
};

// Download invoice as PDF (future implementation)
export const downloadInvoice = async (invoiceId: string): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/invoices/${invoiceId}/download`, {
    headers: getAuthHeader(),
    responseType: 'blob'
  });
  return response.data;
};

// Get vendor profile
export const getProfile = async (): Promise<VendorProfile> => {
  const response = await axios.get(`${API_BASE_URL}/vendor/profile`, {
    headers: getAuthHeader()
  });
  return response.data.profile;
};

// Update vendor profile
export const updateProfile = async (profileData: Partial<VendorProfile>): Promise<VendorProfile> => {
  const response = await axios.put(`${API_BASE_URL}/vendor/profile`, profileData, {
    headers: getAuthHeader()
  });
  return response.data.profile;
};

export default {
  getVendorStats,
  getRecentOrders,
  getOrders,
  getOrderById,
  getProducts,
  getInvoices,
  downloadInvoice,
  getProfile,
  updateProfile
};
