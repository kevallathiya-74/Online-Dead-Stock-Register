import { 
  generateInventoryStats, 
  getWarrantyExpiringAssets, 
  getMaintenanceSchedule, 
  getVendorPerformance,
  locations
} from '../utils/demoData';
import { Asset, AssetStatus, UserRole } from '../types';

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
  getDashboardStats(userRole: UserRole): DashboardStats {
    const cacheKey = `stats_${userRole}`;
    const cached = this.getCachedData<DashboardStats>(cacheKey);
    if (cached) return cached;

    const assets = this.getAssets();
    const inventoryStats = generateInventoryStats();
    
    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => a.status === AssetStatus.ACTIVE).length;
    const inMaintenanceAssets = assets.filter(a => a.status === AssetStatus.IN_MAINTENANCE).length;
    const disposedAssets = assets.filter(a => a.status === AssetStatus.DISPOSED).length;
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const monthlyPurchaseValue = Math.floor(totalValue * 0.15); // Simulate 15% monthly purchases
    
    let stats: DashboardStats = {
      totalAssets,
      activeAssets,
      inMaintenanceAssets,
      disposedAssets,
      totalValue,
      monthlyPurchaseValue,
      activeUsers: 87, // Simulated
      pendingApprovals: Math.floor(Math.random() * 30) + 10,
      locationCount: inventoryStats.locations,
      warrantyExpiring: inventoryStats.warrantySoonCount,
      maintenanceDue: inventoryStats.maintenanceDue,
      purchaseOrders: inventoryStats.purchaseOrders,
    };

    // Role-specific additions
    if (userRole === UserRole.AUDITOR) {
      const assigned = Math.floor(totalAssets * 0.3);
      const completed = Math.floor(assigned * 0.57);
      const pending = assigned - completed;
      const discrepancies = Math.floor(Math.random() * 20) + 5;
      
      stats = {
        ...stats,
        assigned,
        completed,
        pending,
        discrepancies,
        completionRate: Math.round((completed / assigned) * 100)
      };
    }

    return this.setCachedData(cacheKey, stats);
  }

  // Get assets by location for inventory dashboard
  getAssetsByLocation(): LocationData[] {
    const cacheKey = 'assets_by_location';
    const cached = this.getCachedData<LocationData[]>(cacheKey);
    if (cached) return cached;

    const assets = this.getAssets();
    const totalAssets = assets.length;
    
    const locationData = locations.map(location => {
      const count = assets.filter(asset => asset.location === location).length;
      return {
        location,
        count,
        percentage: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0
      };
    }).filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 locations

    return this.setCachedData(cacheKey, locationData);
  }

  // Get warranty expiring assets
  getWarrantyExpiringAssets(): WarrantyExpiringData[] {
    const cacheKey = 'warranty_expiring';
    const cached = this.getCachedData<WarrantyExpiringData[]>(cacheKey);
    if (cached) return cached;

    const data = getWarrantyExpiringAssets();
    return this.setCachedData(cacheKey, data);
  }

  // Get maintenance schedule
  getMaintenanceSchedule(): MaintenanceScheduleData[] {
    const cacheKey = 'maintenance_schedule';
    const cached = this.getCachedData<MaintenanceScheduleData[]>(cacheKey);
    if (cached) return cached;

    const data = getMaintenanceSchedule();
    return this.setCachedData(cacheKey, data);
  }

  // Get vendor performance data
  getVendorPerformance(): VendorData[] {
    const cacheKey = 'vendor_performance';
    const cached = this.getCachedData<VendorData[]>(cacheKey);
    if (cached) return cached;

    const data = getVendorPerformance();
    return this.setCachedData(cacheKey, data);
  }

  // Get assets for employee dashboard (assigned to user)
  getUserAssets(userId: string): Asset[] {
    const cacheKey = `user_assets_${userId}`;
    const cached = this.getCachedData<Asset[]>(cacheKey);
    if (cached) return cached;

    const assets = this.getAssets();
    
    // Simulate user-assigned assets (for demo, we'll take random 3-5 assets)
    const userAssets = assets
      .filter(asset => asset.status === AssetStatus.ACTIVE)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 3); // 3-5 assets

    return this.setCachedData(cacheKey, userAssets);
  }

  // Get audit items for auditor dashboard
  getAuditItems(): any[] {
    const cacheKey = 'audit_items';
    const cached = this.getCachedData<any[]>(cacheKey);
    if (cached) return cached;

    const assets = this.getAssets();
    const auditStatuses = ['pending', 'verified', 'discrepancy'];
    
    const auditItems = assets
      .slice(0, 15) // First 15 assets for audit
      .map((asset, index) => ({
        id: asset.id,
        name: asset.name,
        assetCode: asset.qrCode,
        location: asset.location,
        assignedUser: `User ${Math.floor(Math.random() * 20) + 1}`,
        status: auditStatuses[index % 3],
        lastAudit: this.getRandomPastDate(30, 365),
        notes: index % 3 === 2 ? 'Location mismatch - found in different floor' : undefined
      }));

    return this.setCachedData(cacheKey, auditItems);
  }

  // Get chart data for various dashboards
  getChartData(chartType: 'asset_trends' | 'maintenance_trends' | 'purchase_trends'): any {
    const cacheKey = `chart_${chartType}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

    let data;
    switch (chartType) {
      case 'asset_trends':
        data = {
          labels: last6Months,
          datasets: [{
            label: 'New Assets Added',
            data: last6Months.map(() => Math.floor(Math.random() * 50) + 10),
            borderColor: '#2C3FE6',
            backgroundColor: 'rgba(44, 63, 230, 0.1)',
            tension: 0.4
          }]
        };
        break;
      case 'maintenance_trends':
        data = {
          labels: last6Months,
          datasets: [{
            label: 'Maintenance Completed',
            data: last6Months.map(() => Math.floor(Math.random() * 30) + 5),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
          }]
        };
        break;
      default:
        data = { labels: [], datasets: [] };
    }

    return this.setCachedData(cacheKey, data);
  }

  // Private helper methods
  private getAssets(): Asset[] {
    try {
      return JSON.parse(localStorage.getItem('demo_assets') || '[]');
    } catch {
      return [];
    }
  }

  private getRandomPastDate(minDaysAgo: number, maxDaysAgo: number): string {
    const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString();
  }

  // Refresh all cached data
  refreshCache(): void {
    this.cache.clear();
    console.log('🔄 Dashboard cache refreshed');
  }

  // Get real-time updates simulation
  getRealtimeUpdates(): any {
    return {
      assetsAdded: Math.floor(Math.random() * 5),
      maintenanceCompleted: Math.floor(Math.random() * 3),
      approvalsReceived: Math.floor(Math.random() * 8),
      warrantyAlerts: Math.floor(Math.random() * 2),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance();