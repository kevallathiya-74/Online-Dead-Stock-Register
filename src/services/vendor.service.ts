import api from './api';
import { ApiResponse, Pagination } from '../types';

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

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetVendorsResponse {
  vendors: Vendor[];
  pagination: Pagination;
}

export interface VendorStats {
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  blocked_vendors: number;
  category_breakdown: CategoryBreakdown[];
  top_performers: Vendor[];
  recent_additions: Vendor[];
  contract_expiring_soon: Vendor[];
}

class VendorService {
  // Get all vendors with filtering
  async getVendors(params?: VendorQueryParams): Promise<GetVendorsResponse> {
    try {
      const queryParams = new URLSearchParams(params as Record<string, string> || {}).toString();
      const response = await api.get<ApiResponse<GetVendorsResponse>>(`/inventory/vendors?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch vendors');
    } catch (error) {
      console.error('Error fetching vendors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vendors';
      throw new Error(errorMessage);
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
    } catch (error) {
      console.error('Error fetching vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vendor';
      throw new Error(errorMessage);
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
    } catch (error) {
      console.error('Error creating vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vendor';
      throw new Error(errorMessage);
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
    } catch (error) {
      console.error('Error updating vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor';
      throw new Error(errorMessage);
    }
  }

  // Delete vendor
  async deleteVendor(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(`/inventory/vendors/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vendor';
      throw new Error(errorMessage);
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
    } catch (error) {
      console.error('Error fetching vendor statistics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vendor statistics';
      throw new Error(errorMessage);
    }
  }

  // Bulk operations
  async bulkUpdateVendorStatus(vendorIds: string[], status: 'active' | 'inactive' | 'blocked'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<{ updated: number; message: string }>>('/inventory/vendors/bulk-status', {
        vendor_ids: vendorIds,
        status
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update vendor status');
      }
    } catch (error) {
      console.error('Error updating vendor status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor status';
      throw new Error(errorMessage);
    }
  }
}

export const vendorService = new VendorService();
export default vendorService;