import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types';

// Dashboard Statistics Types
export interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  activeUsers: number;
  pendingApprovals: number;
  scrapAssets: number;
  monthlyPurchase: number;
  trends: {
    assets: { value: number; isPositive: boolean };
    value: { value: number; isPositive: boolean };
    users: { value: number; isPositive: boolean };
    purchase: { value: number; isPositive: boolean };
  };
}

export interface RecentActivity {
  id: string;
  user: string;
  userId: string;
  action: string;
  asset: string;
  assetId?: string;
  time: string;
  type: 'create' | 'update' | 'approve' | 'system';
}

export interface PendingApproval {
  id: string;
  type: string;
  requestor: string;
  requestorId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  description?: string;
}

export interface SystemOverview {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  pendingApprovals: PendingApproval[];
}

class DashboardService {
  // DEVELOPMENT MODE - Use mock data instead of API calls
  private DISABLE_API = true; // Set to false to re-enable API calls

  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Dashboard API disabled - Using mock stats data');
      return {
        totalAssets: 1547,
        totalValue: 25890000,
        activeUsers: 234,
        pendingApprovals: 12,
        scrapAssets: 23,
        monthlyPurchase: 1850000,
        trends: {
          assets: { value: 5.2, isPositive: true },
          value: { value: 12.8, isPositive: true },
          users: { value: 2.1, isPositive: true },
          purchase: { value: 8.7, isPositive: false },
        }
      };
    }

    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch dashboard stats');
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch dashboard stats');
    }
  }

  // Get recent activities
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Dashboard API disabled - Using mock activities data');
      return ([
        {
          id: '1',
          user: 'John Smith',
          userId: 'user_1',
          action: 'created new asset',
          asset: 'Laptop Dell-5420',
          assetId: 'AST-10001',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          type: 'create' as const
        },
        {
          id: '2',
          user: 'Sarah Johnson',
          userId: 'user_2',
          action: 'approved transfer for',
          asset: 'Monitor HP-24inch',
          assetId: 'AST-10002',
          time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          type: 'approve' as const
        },
        {
          id: '3',
          user: 'Mike Wilson',
          userId: 'user_3',
          action: 'updated status of',
          asset: 'Printer Canon-LBP',
          assetId: 'AST-10003',
          time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          type: 'update' as const
        },
        {
          id: '4',
          user: 'System',
          userId: 'system',
          action: 'performed backup of',
          asset: 'Database Server',
          assetId: 'AST-10004',
          time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          type: 'system' as const
        },
        {
          id: '5',
          user: 'Emily Davis',
          userId: 'user_4',
          action: 'created maintenance schedule for',
          asset: 'UPS APC-1500VA',
          assetId: 'AST-10005',
          time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          type: 'create' as const
        },
        {
          id: '6',
          user: 'David Brown',
          userId: 'user_5',
          action: 'approved purchase request for',
          asset: 'Server Dell-R740',
          assetId: 'AST-10006',
          time: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
          type: 'approve' as const
        }
      ] as RecentActivity[]).slice(0, limit);
    }

    try {
      const response = await api.get<ApiResponse<RecentActivity[]>>(`/dashboard/activities?limit=${limit}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch recent activities');
    } catch (error: any) {
      console.error('Error fetching recent activities:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch recent activities');
    }
  }

  // Get pending approvals
  async getPendingApprovals(limit: number = 10): Promise<PendingApproval[]> {
    if (this.DISABLE_API) {
      // Return mock data for development
      console.log('🔧 Dashboard API disabled - Using mock approvals data');
      return ([
        {
          id: 'approval_1',
          type: 'Purchase Order',
          requestor: 'Jennifer Miller',
          requestorId: 'user_6',
          amount: 125000,
          status: 'pending' as const,
          priority: 'high' as const,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          description: 'New server equipment for data center upgrade'
        },
        {
          id: 'approval_2',
          type: 'Asset Transfer',
          requestor: 'Robert Garcia',
          requestorId: 'user_7',
          amount: 45000,
          status: 'pending' as const,
          priority: 'medium' as const,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          description: 'Transfer of laptops to new branch office'
        },
        {
          id: 'approval_3',
          type: 'Maintenance',
          requestor: 'Lisa Anderson',
          requestorId: 'user_8',
          amount: 15000,
          status: 'pending' as const,
          priority: 'medium' as const,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          description: 'Scheduled maintenance for printing equipment'
        },
        {
          id: 'approval_4',
          type: 'Asset Disposal',
          requestor: 'Mark Thompson',
          requestorId: 'user_9',
          amount: 8500,
          status: 'pending' as const,
          priority: 'low' as const,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          description: 'Disposal of obsolete computer equipment'
        },
        {
          id: 'approval_5',
          type: 'Budget Allocation',
          requestor: 'Amanda White',
          requestorId: 'user_10',
          amount: 200000,
          status: 'pending' as const,
          priority: 'high' as const,
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
          description: 'Q4 IT equipment budget allocation request'
        }
      ] as PendingApproval[]).slice(0, limit);
    }

    try {
      const response = await api.get<ApiResponse<PendingApproval[]>>(`/dashboard/approvals?status=pending&limit=${limit}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch pending approvals');
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch pending approvals');
    }
  }

  // Get complete system overview
  async getSystemOverview(): Promise<SystemOverview> {
    try {
      const response = await api.get<ApiResponse<SystemOverview>>('/dashboard/overview');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch system overview');
    } catch (error: any) {
      console.error('Error fetching system overview:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch system overview');
    }
  }

  // Approve/Reject approval request
  async handleApproval(approvalId: string, action: 'approve' | 'reject', comments?: string): Promise<void> {
    if (this.DISABLE_API) {
      // Mock approval action for development
      console.log(`🔧 Dashboard API disabled - Mocking ${action} for approval ${approvalId}`);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    try {
      const response = await api.patch<ApiResponse<void>>(`${API_ENDPOINTS.APPROVAL_BY_ID(approvalId)}`, {
        action,
        comments
      });
      if (!response.data.success) {
        throw new Error(response.data.error || `Failed to ${action} approval`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing approval:`, error);
      throw new Error(error.response?.data?.message || error.message || `Failed to ${action} approval`);
    }
  }

  // Get users count by role
  async getUsersByRole(): Promise<{ [key: string]: number }> {
    try {
      const response = await api.get<ApiResponse<{ [key: string]: number }>>('/dashboard/users-by-role');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch users by role');
    } catch (error: any) {
      console.error('Error fetching users by role:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users by role');
    }
  }

  // Get asset statistics by category
  async getAssetsByCategory(): Promise<{ [key: string]: number }> {
    try {
      const response = await api.get<ApiResponse<{ [key: string]: number }>>('/dashboard/assets-by-category');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch assets by category');
    } catch (error: any) {
      console.error('Error fetching assets by category:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch assets by category');
    }
  }

  // Get monthly trends
  async getMonthlyTrends(): Promise<{ [key: string]: number[] }> {
    try {
      const response = await api.get<ApiResponse<{ [key: string]: number[] }>>('/dashboard/monthly-trends');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch monthly trends');
    } catch (error: any) {
      console.error('Error fetching monthly trends:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch monthly trends');
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;