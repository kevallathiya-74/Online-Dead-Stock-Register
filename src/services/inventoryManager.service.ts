import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types';

// Inventory Manager Dashboard Types
export interface InventoryStats {
  totalAssets: number;
  activeAssets: number;
  inMaintenanceAssets: number;
  disposedAssets: number;
  totalValue: number;
  locationCount: number;
  warrantyExpiring: number;
  maintenanceDue: number;
  monthlyPurchases: number;
  topVendorsCount: number;
  trends: {
    assets: { value: number; isPositive: boolean };
    purchases: { value: number; isPositive: boolean };
  };
}

export interface AssetByLocation {
  location: string;
  count: number;
  percentage: number;
  assets: string[];
}

export interface WarrantyExpiringAsset {
  id: string;
  asset: string;
  assetId: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
  assignedUser?: string;
}

export interface MaintenanceScheduleItem {
  id: string;
  asset: string;
  assetId: string;
  type: string;
  scheduledDate: string;
  technician: string;
  status: string;
  cost?: number;
  description?: string;
}

export interface TopVendor {
  id: string;
  name: string;
  orders: number;
  value: number;
  rating: number;
  categories: string[];
  activeContracts: number;
}

export interface PendingApprovalItem {
  id: string;
  type: string;
  requestor: string;
  requestorId: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  daysAgo: number;
  amount?: number;
  description?: string;
  assetId?: string;
}

class InventoryManagerService {
  // Get inventory manager dashboard statistics
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const response = await api.get<ApiResponse<InventoryStats>>('/dashboard/inventory-stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch inventory stats');
    } catch (error: any) {
      console.error('Error fetching inventory stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch inventory stats');
    }
  }

  // Get assets grouped by location
  async getAssetsByLocation(): Promise<AssetByLocation[]> {
    try {
      const response = await api.get<ApiResponse<AssetByLocation[]>>('/dashboard/assets-by-location');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch assets by location');
    } catch (error: any) {
      console.error('Error fetching assets by location:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch assets by location');
    }
  }

  // Get assets with expiring warranties
  async getWarrantyExpiringAssets(): Promise<WarrantyExpiringAsset[]> {
    try {
      const response = await api.get<ApiResponse<WarrantyExpiringAsset[]>>('/dashboard/warranty-expiring');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch warranty expiring assets');
    } catch (error: any) {
      console.error('Error fetching warranty expiring assets:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch warranty expiring assets');
    }
  }

  // Get maintenance schedule
  async getMaintenanceSchedule(): Promise<MaintenanceScheduleItem[]> {
    try {
      const response = await api.get<ApiResponse<MaintenanceScheduleItem[]>>('/dashboard/maintenance-schedule');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch maintenance schedule');
    } catch (error: any) {
      console.error('Error fetching maintenance schedule:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch maintenance schedule');
    }
  }

  // Get top vendors by performance
  async getTopVendors(): Promise<TopVendor[]> {
    try {
      const response = await api.get<ApiResponse<TopVendor[]>>('/dashboard/top-vendors');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch top vendors');
    } catch (error: any) {
      console.error('Error fetching top vendors:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch top vendors');
    }
  }

  // Get pending approvals for inventory manager
  async getPendingApprovals(): Promise<PendingApprovalItem[]> {
    try {
      const response = await api.get<ApiResponse<PendingApprovalItem[]>>('/dashboard/inventory-approvals');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch pending approvals');
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch pending approvals');
    }
  }

  // Get complete inventory dashboard overview
  async getInventoryOverview(): Promise<{
    stats: InventoryStats;
    assetsByLocation: AssetByLocation[];
    warrantyExpiring: WarrantyExpiringAsset[];
    maintenanceSchedule: MaintenanceScheduleItem[];
    topVendors: TopVendor[];
    pendingApprovals: PendingApprovalItem[];
  }> {
    try {
      const response = await api.get<ApiResponse<any>>('/dashboard/inventory-overview');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch inventory overview');
    } catch (error: any) {
      console.error('Error fetching inventory overview:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch inventory overview');
    }
  }

  // Get asset transfer requests
  async getAssetTransferRequests(): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>('/dashboard/transfer-requests?status=pending');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch transfer requests');
    } catch (error: any) {
      console.error('Error fetching transfer requests:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch transfer requests');
    }
  }

  // Get purchase order statistics
  async getPurchaseOrderStats(): Promise<{
    pending: number;
    approved: number;
    completed: number;
    monthlyTotal: number;
    monthlyValue: number;
  }> {
    try {
      const response = await api.get<ApiResponse<any>>('/dashboard/purchase-order-stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase order stats');
    } catch (error: any) {
      console.error('Error fetching purchase order stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch purchase order stats');
    }
  }

  // Create new asset
  async createAsset(assetData: any): Promise<any> {
    try {
      const response = await api.post<ApiResponse<any>>(API_ENDPOINTS.ASSETS, assetData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create asset');
    } catch (error: any) {
      console.error('Error creating asset:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create asset');
    }
  }

  // Schedule maintenance
  async scheduleMaintenance(maintenanceData: any): Promise<any> {
    try {
      const response = await api.post<ApiResponse<any>>(API_ENDPOINTS.MAINTENANCE.MAINTENANCE_RECORDS, maintenanceData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to schedule maintenance');
    } catch (error: any) {
      console.error('Error scheduling maintenance:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to schedule maintenance');
    }
  }

  // Create purchase order
  async createPurchaseOrder(orderData: any): Promise<any> {
    try {
      const response = await api.post<ApiResponse<any>>('/purchase-orders', orderData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create purchase order');
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create purchase order');
    }
  }

  // Initiate asset transfer
  async initiateAssetTransfer(transferData: any): Promise<any> {
    try {
      const response = await api.post<ApiResponse<any>>(API_ENDPOINTS.TRANSACTIONS, {
        ...transferData,
        transaction_type: 'Asset Transfer'
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to initiate asset transfer');
    } catch (error: any) {
      console.error('Error initiating asset transfer:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to initiate asset transfer');
    }
  }

  // Update asset warranty
  async updateAssetWarranty(assetId: string, warrantyData: any): Promise<any> {
    try {
      const response = await api.patch<ApiResponse<any>>(
        API_ENDPOINTS.ASSET_BY_ID(assetId), 
        { warranty_expiry: warrantyData.expiryDate }
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to update asset warranty');
    } catch (error: any) {
      console.error('Error updating asset warranty:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update asset warranty');
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>('/dashboard/low-stock-alerts');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch low stock alerts');
    } catch (error: any) {
      console.error('Error fetching low stock alerts:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch low stock alerts');
    }
  }

  // Get asset utilization report
  async getAssetUtilization(): Promise<any> {
    try {
      const response = await api.get<ApiResponse<any>>('/dashboard/asset-utilization');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch asset utilization');
    } catch (error: any) {
      console.error('Error fetching asset utilization:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch asset utilization');
    }
  }
}

export const inventoryManagerService = new InventoryManagerService();
export default inventoryManagerService;