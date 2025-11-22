import api from './api';
import { ApiResponse } from '../types';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Asset {
  id: string;
  unique_asset_id: string;
  name: string;
  manufacturer: string;
  model: string;
}

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
  asset: Asset;
  from_user: User;
  to_user: User;
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
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to create asset transfer request');
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
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to fetch asset transfers');
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
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to fetch asset transfer details');
    }
  }
}

export const assetTransferService = new AssetTransferService();
export default assetTransferService;