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
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
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
      return cached.data;
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
      const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS(userRole));
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching assets by location:', error);
      throw error;
    }
  }

  // Get warranty expiring assets
  async getWarrantyExpiringAssets(): Promise<WarrantyExpiringData[]> {
    const cacheKey = 'warranty_expiring';
    const cached = this.getCachedData<WarrantyExpiringData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.WARRANTY_EXPIRING);
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching warranty expiring assets:', error);
      throw error;
    }
  }

  // Get maintenance schedule
  async getMaintenanceSchedule(): Promise<MaintenanceScheduleData[]> {
    const cacheKey = 'maintenance_schedule';
    const cached = this.getCachedData<MaintenanceScheduleData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.MAINTENANCE_SCHEDULE);
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
      throw error;
    }
  }

  // Get vendor performance data
  async getVendorPerformance(): Promise<VendorData[]> {
    const cacheKey = 'vendor_performance';
    const cached = this.getCachedData<VendorData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.VENDOR_PERFORMANCE);
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching vendor performance:', error);
      throw error;
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
      console.error('Error fetching user assets:', error);
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
      return this.setCachedData(cacheKey, response.data);
    } catch (error) {
      console.error('Error fetching audit items:', error);
      throw error;
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
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  // Refresh all cached data
  refreshCache(): void {
    this.cache.clear();
    console.log('Dashboard cache refreshed');
  }

  // Get real-time updates
  async getRealtimeUpdates(): Promise<any> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.REALTIME_UPDATES);
      return response.data;
    } catch (error) {
      console.error('Error fetching realtime updates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance();