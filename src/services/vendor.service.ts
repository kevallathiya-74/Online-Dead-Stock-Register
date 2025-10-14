import api from './api';
import { ApiResponse } from '../types';

// Vendor Management Service
export interface Vendor {
  id: string;
  name: string;
  vendor_code: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  categories: string[];
  status: 'active' | 'inactive' | 'blocked';
  payment_terms: string;
  tax_id?: string;
  bank_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
    routing_number: string;
  };
  performance_rating: number;
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorStats {
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  blocked_vendors: number;
  category_breakdown: any[];
  top_performers: Vendor[];
  recent_additions: Vendor[];
  contract_expiring_soon: Vendor[];
}

class VendorService {
  // Get all vendors with filtering
  async getVendors(params?: any): Promise<{
    vendors: Vendor[];
    pagination: any;
  }> {
    try {
      const queryParams = new URLSearchParams(params || {}).toString();
      const response = await api.get<ApiResponse<any>>(`/inventory/vendors?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch vendors');
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch vendors');
    }
  }

  // Get vendor by ID
  async getVendorById(id: string): Promise<Vendor> {
    try {
      const response = await api.get<ApiResponse<Vendor>>(`/inventory/vendors/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch vendor');
    } catch (error: any) {
      console.error('Error fetching vendor:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch vendor');
    }
  }

  // Create new vendor
  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      const response = await api.post<ApiResponse<Vendor>>('/inventory/vendors', vendorData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create vendor');
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create vendor');
    }
  }

  // Update vendor
  async updateVendor(id: string, vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      const response = await api.put<ApiResponse<Vendor>>(`/inventory/vendors/${id}`, vendorData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to update vendor');
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update vendor');
    }
  }

  // Delete vendor
  async deleteVendor(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<any>>(`/inventory/vendors/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete vendor');
      }
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete vendor');
    }
  }

  // Get vendor statistics
  async getVendorStats(): Promise<VendorStats> {
    try {
      const response = await api.get<ApiResponse<VendorStats>>('/inventory/vendors/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch vendor statistics');
    } catch (error: any) {
      console.error('Error fetching vendor statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch vendor statistics');
    }
  }

  // Bulk operations
  async bulkUpdateVendorStatus(vendorIds: string[], status: 'active' | 'inactive' | 'blocked'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>('/inventory/vendors/bulk-status', {
        vendor_ids: vendorIds,
        status
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update vendor status');
      }
    } catch (error: any) {
      console.error('Error updating vendor status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update vendor status');
    }
  }
}

export const vendorService = new VendorService();
export default vendorService;