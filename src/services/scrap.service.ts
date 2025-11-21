import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface ScrapItem {
  _id: string;
  id?: string;
  assetId: string;
  assetName: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  currentLocation: string;
  scrapReason: 'End of Life' | 'Beyond Repair' | 'Obsolete' | 'Policy Compliance' | 'Accident Damage';
  scrapDate: string;
  approvalDate?: string;
  disposalDate?: string;
  status: 'Pending Approval' | 'Approved for Scrap' | 'In Disposal Process' | 'Disposed' | 'Sold' | 'Recycled';
  originalValue: number;
  scrapValue: number;
  disposalMethod: 'Recycle' | 'Sell' | 'Donate' | 'Destroy' | 'Return to Vendor';
  approvedBy?: string;
  vendorName?: string;
  documentReference?: string;
  environmentalCompliance: boolean;
}

export interface ScrapFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ScrapResponse {
  success: boolean;
  data: ScrapItem[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ScrapRequest {
  assetId: string;
  scrapReason: string;
  estimatedValue?: number;
  notes?: string;
  disposalMethod?: string;
}

class ScrapService {
  /**
   * Get all scrap items with optional filters
   */
  async getScrapItems(filters?: ScrapFilters): Promise<ScrapResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = API_ENDPOINTS.INVENTORY.SCRAP + (queryString ? `?${queryString}` : '');
    
    const response = await api.get(endpoint);
    return response.data;
  }

  /**
   * Get a single scrap item by ID
   */
  async getScrapItemById(id: string): Promise<ScrapItem> {
    const response = await api.get(API_ENDPOINTS.INVENTORY.SCRAP_BY_ID(id));
    return response.data.data;
  }

  /**
   * Create a new scrap request
   */
  async createScrapRequest(data: ScrapRequest): Promise<ScrapItem> {
    const response = await api.post(API_ENDPOINTS.INVENTORY.SCRAP, data);
    return response.data.data;
  }

  /**
   * Approve a scrap item
   */
  async approveScrapItem(id: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post(API_ENDPOINTS.INVENTORY.SCRAP_APPROVE(id));
    return response.data;
  }

  /**
   * Update scrap item status
   */
  async updateScrapStatus(
    id: string, 
    status: string, 
    data?: { disposalDate?: string; vendorName?: string; documentReference?: string }
  ): Promise<ScrapItem> {
    const response = await api.patch(API_ENDPOINTS.INVENTORY.SCRAP_BY_ID(id), {
      status,
      ...data
    });
    return response.data.data;
  }

  /**
   * Export scrap report
   */
  async exportScrapReport(format: 'csv' | 'pdf' = 'csv', filters?: ScrapFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    }

    const response = await api.get(`${API_ENDPOINTS.INVENTORY.SCRAP}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Get scrap statistics
   */
  async getScrapStats(): Promise<{
    pendingCount: number;
    approvedCount: number;
    inProcessCount: number;
    completedCount: number;
    totalScrapValue: number;
    totalLossValue: number;
  }> {
    const response = await api.get(`${API_ENDPOINTS.INVENTORY.SCRAP}/stats`);
    return response.data.data;
  }

  /**
   * Delete a scrap record (admin only)
   */
  async deleteScrapItem(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.INVENTORY.SCRAP_BY_ID(id));
  }
}

export const scrapService = new ScrapService();
export default scrapService;
