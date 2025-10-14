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
  // DEVELOPMENT FLAG - Set to true to disable API calls and use mock data
  private readonly DISABLE_API = true;

  // Get inventory manager dashboard statistics
  async getInventoryStats(): Promise<InventoryStats> {
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock stats data');
      return {
        totalAssets: 1547,
        activeAssets: 1234,
        inMaintenanceAssets: 89,
        disposedAssets: 79,
        totalValue: 25890000,
        locationCount: 8,
        warrantyExpiring: 23,
        maintenanceDue: 12,
        monthlyPurchases: 145,
        topVendorsCount: 15,
        trends: {
          assets: { value: 5.2, isPositive: true },
          purchases: { value: 8.7, isPositive: true }
        }
      };
    }

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
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock location data');
      return [
        {
          location: 'Head Office',
          count: 456,
          percentage: 29.5,
          assets: ['Laptops', 'Desktops', 'Printers', 'Servers']
        },
        {
          location: 'Branch Office A',
          count: 324,
          percentage: 20.9,
          assets: ['Laptops', 'Monitors', 'Furniture']
        },
        {
          location: 'Warehouse',
          count: 298,
          percentage: 19.3,
          assets: ['Equipment', 'Machinery', 'Tools']
        },
        {
          location: 'Branch Office B',
          count: 234,
          percentage: 15.1,
          assets: ['Computers', 'Printers']
        },
        {
          location: 'Data Center',
          count: 156,
          percentage: 10.1,
          assets: ['Servers', 'Network Equipment']
        },
        {
          location: 'Training Center',
          count: 79,
          percentage: 5.1,
          assets: ['Projectors', 'Audio Equipment']
        }
      ];
    }

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
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock warranty data');
      return [
        {
          id: 'warranty_1',
          asset: 'Dell Laptop Inspiron 15',
          assetId: 'AST-10101',
          category: 'Computing',
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          daysLeft: 15,
          priority: 'high',
          assignedUser: 'John Smith'
        },
        {
          id: 'warranty_2',
          asset: 'HP Printer LaserJet Pro',
          assetId: 'AST-10102',
          category: 'Office Equipment',
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          daysLeft: 45,
          priority: 'medium',
          assignedUser: 'Sarah Johnson'
        },
        {
          id: 'warranty_3',
          asset: 'Network Switch Cisco',
          assetId: 'AST-10103',
          category: 'Network Equipment',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          daysLeft: 30,
          priority: 'high'
        }
      ];
    }

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
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock maintenance data');
      return [
        {
          id: 'maint_1',
          asset: 'Air Conditioning Unit',
          assetId: 'AST-20001',
          type: 'Preventive',
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          technician: 'Mike Wilson',
          status: 'Scheduled',
          cost: 5000,
          description: 'Quarterly maintenance and filter replacement'
        },
        {
          id: 'maint_2',
          asset: 'Generator Backup',
          assetId: 'AST-20002',
          type: 'Inspection',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          technician: 'David Brown',
          status: 'Pending',
          cost: 8000,
          description: 'Monthly generator inspection and oil change'
        },
        {
          id: 'maint_3',
          asset: 'Elevator System',
          assetId: 'AST-20003',
          type: 'Corrective',
          scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          technician: 'Lisa Anderson',
          status: 'In Progress',
          cost: 12000,
          description: 'Repair elevator door mechanism'
        }
      ];
    }

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
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock vendors data');
      return [
        {
          id: 'vendor_1',
          name: 'Dell Technologies',
          orders: 12,
          value: 8500000,
          rating: 4.8,
          categories: ['Computing Equipment', 'Laptops'],
          activeContracts: 12
        },
        {
          id: 'vendor_2',
          name: 'HP Inc.',
          orders: 8,
          value: 5200000,
          rating: 4.6,
          categories: ['Printers', 'Accessories'],
          activeContracts: 8
        },
        {
          id: 'vendor_3',
          name: 'Cisco Systems',
          orders: 6,
          value: 4100000,
          rating: 4.9,
          categories: ['Network Equipment', 'Security'],
          activeContracts: 6
        },
        {
          id: 'vendor_4',
          name: 'Microsoft Corporation',
          orders: 4,
          value: 3300000,
          rating: 4.7,
          categories: ['Software', 'Licenses'],
          activeContracts: 4
        },
        {
          id: 'vendor_5',
          name: 'Lenovo Group',
          orders: 5,
          value: 2800000,
          rating: 4.5,
          categories: ['Laptops', 'Tablets'],
          activeContracts: 5
        }
      ];
    }

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
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Inventory Manager API disabled - Using mock approvals data');
      return [
        {
          id: 'approval_inv_1',
          type: 'Purchase Request',
          requestor: 'IT Department',
          requestorId: 'dept_it',
          priority: 'High',
          daysAgo: 2,
          amount: 150000,
          description: 'New laptops for development team',
          assetId: 'PO-2024-001'
        },
        {
          id: 'approval_inv_2',
          type: 'Asset Transfer',
          requestor: 'HR Department',
          requestorId: 'dept_hr',
          priority: 'Medium',
          daysAgo: 5,
          amount: 25000,
          description: 'Transfer furniture to new branch',
          assetId: 'AST-TR-001'
        },
        {
          id: 'approval_inv_3',
          type: 'Maintenance Budget',
          requestor: 'Operations Team',
          requestorId: 'dept_ops',
          priority: 'Low',
          daysAgo: 1,
          amount: 45000,
          description: 'Annual HVAC system maintenance',
          assetId: 'MAINT-2024-Q4'
        }
      ];
    }

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
      const response = await api.post<ApiResponse<any>>(API_ENDPOINTS.MAINTENANCE, maintenanceData);
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