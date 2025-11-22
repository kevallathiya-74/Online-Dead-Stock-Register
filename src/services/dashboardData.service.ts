/**
 * DASHBOARD DATA SERVICE - Real API Integration
 * 
 * Connected Backend Endpoints (Inventory Manager):
 * - GET /api/v1/dashboard/inventory-stats - Inventory statistics
 * - GET /api/v1/dashboard/assets-by-location - Assets grouped by location
 * - GET /api/v1/dashboard/warranty-expiring - Warranties expiring soon
 * - GET /api/v1/dashboard/maintenance-schedule - Upcoming maintenance
 * - GET /api/v1/dashboard/top-vendors - Top performing vendors
 * - GET /api/v1/dashboard/inventory-approvals - Pending approvals
 * 
 * Data Flow: Frontend → Service → Backend Controller → MongoDB
 * Authentication: Bearer token in Authorization header
 * Caching: Backend implements Redis caching (300-600s TTL)
 * Role Access: Role-based endpoints (ADMIN, INVENTORY_MANAGER, AUDITOR, VENDOR)
 */

import { Asset, AssetStatus, UserRole } from '../types';
import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  inMaintenanceAssets: number;
  disposedAssets: number;
  totalValue: number;
  monthlyPurchaseValue: number;
  activeUsers: number;
  pendingApprovals: number;
  locationCount: number;
  warrantyExpiring: number;
  maintenanceDue: number;
  purchaseOrders: number;
  completionRate?: number;
  assigned?: number;
  completed?: number;
  pending?: number;
  discrepancies?: number;
}

export interface LocationData {
  location: string;
  count: number;
  percentage: number;
}

export interface WarrantyExpiringData {
  asset: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
}

export interface MaintenanceScheduleData {
  asset: string;
  type: string;
  scheduledDate: string;
  technician: string;
  status: string;
}

export interface VendorData {
  name: string;
  orders: number;
  value: string;
  rating: number;
}

export class DashboardDataService {
  private static instance: DashboardDataService;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T): T {
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Get dashboard statistics based on user role
  async getDashboardStats(userRole: UserRole): Promise<DashboardStats> {
    const cacheKey = `stats_${userRole}`;
    const cached = this.getCachedData<DashboardStats>(cacheKey);
    if (cached) return cached;

    try {
      // Use role-specific endpoints
      let endpoint = API_ENDPOINTS.DASHBOARD.STATS;
      if (userRole === UserRole.ADMIN) {
        endpoint = API_ENDPOINTS.DASHBOARD.ADMIN_STATS;
      } else if (userRole === UserRole.INVENTORY_MANAGER) {
        endpoint = API_ENDPOINTS.DASHBOARD.INVENTORY_STATS;
      } else if (userRole === UserRole.AUDITOR) {
        endpoint = API_ENDPOINTS.DASHBOARD.AUDITOR_STATS;
      }
      const response = await api.get(endpoint);
      
      // Extract data from the response (backend returns { success: true, data: {...} })
      const statsData = response.data.data || response.data;
      return this.setCachedData(cacheKey, statsData);
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number; data?: { message?: string } }; config?: { url?: string } };
      throw error;
    }
  }

  // Get assets by location for inventory dashboard
  async getAssetsByLocation(): Promise<LocationData[]> {
    const cacheKey = 'assets_by_location';
    const cached = this.getCachedData<LocationData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.ASSETS_LOCATION);
      const data = response.data.data || response.data || [];
      return this.setCachedData(cacheKey, Array.isArray(data) ? data : []);
    } catch (error) {
      return []; // Return empty array instead of throwing
    }
  }

  // Get warranty expiring assets
  async getWarrantyExpiringAssets(): Promise<WarrantyExpiringData[]> {
    const cacheKey = 'warranty_expiring';
    const cached = this.getCachedData<WarrantyExpiringData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.WARRANTY_EXPIRING);
      const data = response.data.data || response.data || [];
      return this.setCachedData(cacheKey, Array.isArray(data) ? data : []);
    } catch (error) {
      return []; // Return empty array instead of throwing
    }
  }

  // Get maintenance schedule
  async getMaintenanceSchedule(): Promise<MaintenanceScheduleData[]> {
    const cacheKey = 'maintenance_schedule';
    const cached = this.getCachedData<MaintenanceScheduleData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.MAINTENANCE_SCHEDULE);
      const data = response.data.data || response.data || [];
      return this.setCachedData(cacheKey, Array.isArray(data) ? data : []);
    } catch (error) {
      return []; // Return empty array instead of throwing
    }
  }

  // Get vendor performance data
  async getVendorPerformance(): Promise<VendorData[]> {
    const cacheKey = 'vendor_performance';
    const cached = this.getCachedData<VendorData[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use the correct top-vendors endpoint from backend
      const response = await api.get(API_ENDPOINTS.DASHBOARD.TOP_VENDORS);
      const vendors = response.data.data || response.data || [];
      return this.setCachedData(cacheKey, Array.isArray(vendors) ? vendors : []);
    } catch (error) {
      return []; // Return empty array instead of throwing to prevent dashboard crash
    }
  }

  // Get assets for employee dashboard (assigned to user)
  async getUserAssets(userId: string): Promise<Asset[]> {
    const cacheKey = `user_assets_${userId}`;
    const cached = this.getCachedData<Asset[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.USER_ASSETS(userId));
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      throw error;
    }
  }

  // Get audit items for auditor dashboard
  async getAuditItems(): Promise<any[]> {
    const cacheKey = 'audit_items';
    const cached = this.getCachedData<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.AUDIT_ITEMS);
      const data = response.data.data || response.data || [];
      return this.setCachedData(cacheKey, Array.isArray(data) ? data : []);
    } catch (error) {
      return [];
    }
  }

  // Get chart data for various dashboards
  async getChartData(chartType: 'asset_trends' | 'maintenance_trends' | 'purchase_trends'): Promise<any> {
    const cacheKey = `chart_${chartType}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.CHART_DATA(chartType));
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      throw error;
    }
  }

  // Refresh all cached data
  refreshCache(): void {
    this.cache.clear();
  }

  // Get real-time updates
  async getRealtimeUpdates(): Promise<any> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.REALTIME_UPDATES);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance();