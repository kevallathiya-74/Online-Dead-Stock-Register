import api from './api';
import { ApiResponse } from '../types';

// Asset Transfer Service - Placeholder for future implementation
export interface AssetTransferRequest {
  asset_id: string;
  from_user: string;
  to_user: string;
  from_location: string;
  to_location: string;
  transfer_reason: string;
  description: string;
  expected_transfer_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AssetTransfer {
  id: string;
  transfer_id: string;
  asset: any;
  from_user: any;
  to_user: any;
  from_location: string;
  to_location: string;
  status: string;
  transfer_reason: string;
  description: string;
  expected_transfer_date: string;
  actual_transfer_date?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

class AssetTransferService {
  // Create asset transfer request
  async createTransferRequest(transferRequest: AssetTransferRequest): Promise<AssetTransfer> {
    try {
      const response = await api.post<ApiResponse<AssetTransfer>>('/asset-transfers', transferRequest);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create asset transfer request');
    } catch (error: any) {
      console.error('Error creating asset transfer request:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create asset transfer request');
    }
  }

  // Get user's asset transfers
  async getUserTransfers(): Promise<AssetTransfer[]> {
    try {
      const response = await api.get<ApiResponse<{ transfers: AssetTransfer[] }>>('/asset-transfers');
      if (response.data.success && response.data.data) {
        return response.data.data.transfers;
      }
      throw new Error(response.data.error || 'Failed to fetch asset transfers');
    } catch (error: any) {
      console.error('Error fetching asset transfers:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch asset transfers');
    }
  }

  // Get transfer by ID
  async getTransferById(transferId: string): Promise<AssetTransfer> {
    try {
      const response = await api.get<ApiResponse<AssetTransfer>>(`/asset-transfers/${transferId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch asset transfer details');
    } catch (error: any) {
      console.error('Error fetching asset transfer details:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch asset transfer details');
    }
  }
}

export const assetTransferService = new AssetTransferService();
export default assetTransferService;