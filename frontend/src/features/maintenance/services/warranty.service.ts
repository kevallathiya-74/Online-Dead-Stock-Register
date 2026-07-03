import { API_ENDPOINTS } from '../../../config/api.config';
import { apiGet, apiPatch, apiPost } from '../../../utils/apiClient';
import api from '../../../services/api';

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
    const params: Record<string, unknown> = {};
    
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'All') params.status = filters.status;
      if (filters.expiringDays) params.expiringDays = filters.expiringDays;
    }

    const response = await apiGet<{ data: WarrantyItem[]; total: number }>(
      API_ENDPOINTS.MAINTENANCE.WARRANTIES,
      params,
      'Failed to fetch warranties'
    );
    
    // Map backend 'id' field to '_id' for frontend consistency
    if (response.data) {
      response.data = response.data
        .map((warranty: Partial<WarrantyItem> & { id?: string }) => ({
          ...warranty,
          _id: warranty.id || warranty._id || '',
        }))
        .filter((warranty: any) => warranty._id !== '') as WarrantyItem[];
    }
    
    return { success: true, ...response };
  }

  /**
   * Get warranty by ID
   */
  async getWarrantyById(id: string): Promise<WarrantyItem> {
    return apiGet<WarrantyItem>(API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id), undefined, 'Failed to fetch warranty');
  }

  /**
   * File a warranty claim
   */
  async fileWarrantyClaim(claim: WarrantyClaim): Promise<{ success: boolean; message: string; data: WarrantyItem }> {
    const data = await apiPost<WarrantyItem>(API_ENDPOINTS.MAINTENANCE.WARRANTY_CLAIM, claim, 'Failed to file warranty claim');
    return { success: true, message: 'Warranty claim filed successfully', data };
  }

  /**
   * Update warranty information
   */
  async updateWarranty(id: string, data: Partial<WarrantyItem>): Promise<WarrantyItem> {
    return apiPatch<WarrantyItem>(API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id), data, 'Failed to update warranty');
  }

  /**
   * Export warranty report
   */
  async exportWarrantyReport(format: 'csv' | 'pdf' = 'csv', filters?: WarrantyFilters): Promise<Blob> {
    const params: Record<string, unknown> = { format };
    
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'All') params.status = filters.status;
    }

    const response = await api.get(`${API_ENDPOINTS.MAINTENANCE.WARRANTIES}/export`, {
      params,
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
    return apiGet<{
      activeCount: number;
      expiringCount: number;
      expiredCount: number;
      totalCoverageValue: number;
      claimRate: number;
    }>(`${API_ENDPOINTS.MAINTENANCE.WARRANTIES}/stats`, undefined, 'Failed to fetch warranty statistics');
  }

  /**
   * Extend warranty
   */
  async extendWarranty(id: string, newEndDate: string, cost?: number): Promise<WarrantyItem> {
    return apiPost<WarrantyItem>(
      `${API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(id)}/extend`,
      { newEndDate, cost },
      'Failed to extend warranty'
    );
  }

  /**
   * Get warranty claim history
   */
  async getClaimHistory(warrantyId: string): Promise<unknown[]> {
    return apiGet<unknown[]>(`${API_ENDPOINTS.MAINTENANCE.WARRANTY_BY_ID(warrantyId)}/claims`, undefined, 'Failed to fetch claim history');
  }
}

export const warrantyService = new WarrantyService();
export default warrantyService;
