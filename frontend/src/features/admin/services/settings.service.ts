import { apiGet, apiPatch, apiPost, apiPut } from '../../../utils/apiClient';

export interface SecuritySettings {
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  requireUppercase: boolean;
}

export interface DatabaseSettings {
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  backupLocation: string;
  connectionPoolSize: number;
  queryTimeout: number;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enableNotifications: boolean;
}

export interface ApplicationSettings {
  appName: string;
  appVersion: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: string;
  language: string;
  itemsPerPage: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface SystemSettings {
  security: SecuritySettings;
  database: DatabaseSettings;
  email: EmailSettings;
  application: ApplicationSettings;
  _id?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsHistoryItem {
  _id: string;
  category: 'security' | 'database' | 'email' | 'application' | 'all';
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  ipAddress: string;
  userAgent: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  changeDescription?: string;
}

export interface SettingsHistoryResponse {
  history: SettingsHistoryItem[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface SearchResult {
  category: string;
  field: string;
  value: any;
  path: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface AllConnectionsTestResult {
  success: boolean;
  message: string;
  results: {
    database: ConnectionTestResult;
    email: ConnectionTestResult;
    redis?: ConnectionTestResult;
  };
}

class SettingsService {
  /**
   * Get all system settings
   */
  async getSettings(): Promise<SystemSettings> {
    return apiGet<SystemSettings>('/settings', undefined, 'Failed to fetch settings');
  }

  /**
   * Update all system settings
   */
  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    return apiPut<SystemSettings>('/settings', updates, 'Failed to update settings');
  }

  /**
   * Update specific category settings
   */
  async updateCategory(
    category: 'security' | 'database' | 'email' | 'application',
    updates: Partial<SecuritySettings | DatabaseSettings | EmailSettings | ApplicationSettings>
  ): Promise<SystemSettings> {
    return apiPatch<SystemSettings>(`/settings/${category}`, updates, 'Failed to update category settings');
  }

  /**
   * Search settings
   */
  async searchSettings(query: string): Promise<SearchResult[]> {
    return apiGet<SearchResult[]>('/settings/search', { query }, 'Failed to search settings');
  }

  /**
   * Get settings change history
   */
  async getHistory(filters?: {
    category?: 'security' | 'database' | 'email' | 'application' | 'all';
    field?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<SettingsHistoryResponse> {
    return apiGet<SettingsHistoryResponse>('/settings/history', filters, 'Failed to fetch settings history');
  }

  /**
   * Get recent changes
   */
  async getRecentChanges(limit = 10): Promise<SettingsHistoryItem[]> {
    return apiGet<SettingsHistoryItem[]>('/settings/history/recent', { limit }, 'Failed to fetch recent changes');
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(connectionString?: string): Promise<ConnectionTestResult> {
    return apiPost<ConnectionTestResult>('/settings/test/database', { connectionString }, 'Failed to test database connection');
  }

  /**
   * Test email connection
   */
  async testEmailConnection(emailConfig?: Partial<EmailSettings>): Promise<ConnectionTestResult> {
    return apiPost<ConnectionTestResult>('/settings/test/email', { emailConfig }, 'Failed to test email connection');
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(redisUrl?: string): Promise<ConnectionTestResult> {
    return apiPost<ConnectionTestResult>('/settings/test/redis', { redisUrl }, 'Failed to test Redis connection');
  }

  /**
   * Test all connections
   */
  async testAllConnections(): Promise<AllConnectionsTestResult> {
    return apiPost<AllConnectionsTestResult>('/settings/test/all', {}, 'Failed to test all connections');
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<ConnectionTestResult> {
    return apiPost<ConnectionTestResult>('/settings/test/send-email', { email }, 'Failed to send test email');
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<SystemSettings> {
    return apiPost<SystemSettings>('/settings/reset', {}, 'Failed to reset settings to defaults');
  }

  /**
   * Export settings
   */
  async exportSettings(): Promise<{
    exportDate: string;
    version: string;
    settings: SystemSettings;
  }> {
    return apiGet<{
      exportDate: string;
      version: string;
      settings: SystemSettings;
    }>('/settings/export', undefined, 'Failed to export settings');
  }

  /**
   * Import settings
   */
  async importSettings(importData: {
    settings: Partial<SystemSettings>;
  }): Promise<SystemSettings> {
    return apiPost<SystemSettings>('/settings/import', importData, 'Failed to import settings');
  }

  /**
   * Get accessible categories for current user
   */
  async getAccessibleCategories(): Promise<string[]> {
    return apiGet<string[]>('/settings/accessible-categories', undefined, 'Failed to fetch accessible categories');
  }

  /**
   * Get role permissions configuration
   */
  async getRolePermissions(): Promise<Record<string, string[]>> {
    return apiGet<Record<string, string[]>>('/settings/role-permissions', undefined, 'Failed to fetch role permissions');
  }

  /**
   * Update role permissions for a category (admin only)
   */
  async updateRolePermissions(
    category: 'security' | 'database' | 'email' | 'application',
    roles: string[]
  ): Promise<Record<string, string[]>> {
    return apiPut<Record<string, string[]>>('/settings/role-permissions', { category, roles }, 'Failed to update role permissions');
  }
}

export default new SettingsService();
