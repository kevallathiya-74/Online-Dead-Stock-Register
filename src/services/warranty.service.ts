import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface WarrantyItem {
  _id: string;
  id?: string;
  assetId: string;
  assetName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyType: 'Standard' | 'Extended' | 'Comprehensive';
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Expiring Soon' | 'Claim Filed';
  vendor: string;
  claimHistory: number;
  coverageDetails: string;
  lastClaimDate?: string;
  coverageValue?: number;
}

export interface WarrantyFilters {
  search?: string;
  status?: string;
  expiringDays?: number;
}

export interface WarrantyClaim {
  warrantyId: string;
  assetId: string;
  description: string;
  issueType: string;
  contactPerson?: string;
  contactEmail?: string;
}

class WarrantyService {
  /**
   * Get all warranties
   */
  async getWarranties(filters?: WarrantyFilters): Promise<{ success: boolean; data: WarrantyItem[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters.expiringDays) params.append('expiringDays', filters.expiringDays.toString());
    }

    const queryString = params.toString();
    const endpoint = API_ENDPOINTS.MAINTENANCE.WARRANTIES + (queryString ? `?${queryString}` : '');
    
    const response = await api.get(endpoint);
    
    // Map backend 'id' field to '_id' for frontend consistency
    if (response.data.data) {
      response.data.data = response.data.data.map((warranty: any) => ({
        ...warranty,
        _id: warranty.id || warranty._id,
      }));
    }
    
    return response.data;
  }

  /**
   * Get warranty by ID
   */
  async getWarrantyById(id: string): Promise<WarrantyItem> {
    const response = await api.get(API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id));
    return response.data.data;
  }

  /**
   * File a warranty claim
   */
  async fileWarrantyClaim(claim: WarrantyClaim): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post(API_ENDPOINTS.MAINTENANCE.WARRANTY_CLAIM, claim);
    return response.data;
  }

  /**
   * Update warranty information
   */
  async updateWarranty(id: string, data: Partial<WarrantyItem>): Promise<WarrantyItem> {
    const response = await api.patch(API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id), data);
    return response.data.data;
  }

  /**
   * Export warranty report
   */
  async exportWarrantyReport(format: 'csv' | 'pdf' = 'csv', filters?: WarrantyFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    }

    const response = await api.get(`${API_ENDPOINTS.MAINTENANCE.WARRANTIES}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Get warranty statistics
   */
  async getWarrantyStats(): Promise<{
    activeCount: number;
    expiringCount: number;
    expiredCount: number;
    totalCoverageValue: number;
    claimRate: number;
  }> {
    const response = await api.get(`${API_ENDPOINTS.MAINTENANCE.WARRANTIES}/stats`);
    return response.data.data;
  }

  /**
   * Extend warranty
   */
  async extendWarranty(id: string, newEndDate: string, cost?: number): Promise<WarrantyItem> {
    const response = await api.post(`${API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id)}/extend`, {
      newEndDate,
      cost
    });
    return response.data.data;
  }

  /**
   * Get warranty claim history
   */
  async getClaimHistory(warrantyId: string): Promise<any[]> {
    const response = await api.get(`${API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(warrantyId)}/claims`);
    return response.data.data;
  }
}

export const warrantyService = new WarrantyService();
export default warrantyService;
