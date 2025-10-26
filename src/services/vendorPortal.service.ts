import axios from 'axios';
import type { 
  VendorStats, 
  VendorOrder, 
  VendorProduct, 
  VendorInvoice, 
  VendorProfile 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
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
}): Promise<{ orders: VendorOrder[]; pagination: any }> => {
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
}): Promise<{ products: VendorProduct[]; pagination: any }> => {
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
}): Promise<{ invoices: VendorInvoice[]; summary: any }> => {
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
