import api from './api';

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
  oldValue: unknown;
  newValue: unknown;
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
  value: unknown;
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
    const response = await api.get('/settings');
    return response.data.data;
  }

  /**
   * Update all system settings
   */
  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.put('/settings', updates);
    return response.data.data;
  }

  /**
   * Update specific category settings
   */
  async updateCategory(
    category: 'security' | 'database' | 'email' | 'application',
    updates: Partial<SecuritySettings | DatabaseSettings | EmailSettings | ApplicationSettings>
  ): Promise<SystemSettings> {
    const response = await api.patch(`/settings/${category}`, updates);
    return response.data.data;
  }

  /**
   * Search settings
   */
  async searchSettings(query: string): Promise<SearchResult[]> {
    const response = await api.get('/settings/search', {
      params: { query },
    });
    return response.data.data;
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
    const response = await api.get('/settings/history', {
      params: filters,
    });
    return {
      history: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get recent changes
   */
  async getRecentChanges(limit = 10): Promise<SettingsHistoryItem[]> {
    const response = await api.get('/settings/history/recent', {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(connectionString?: string): Promise<ConnectionTestResult> {
    const response = await api.post('/settings/test/database', {
      connectionString,
    });
    return response.data.data;
  }

  /**
   * Test email connection
   */
  async testEmailConnection(emailConfig?: Partial<EmailSettings>): Promise<ConnectionTestResult> {
    const response = await api.post('/settings/test/email', {
      emailConfig,
    });
    return response.data.data;
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(redisUrl?: string): Promise<ConnectionTestResult> {
    const response = await api.post('/settings/test/redis', {
      redisUrl,
    });
    return response.data.data;
  }

  /**
   * Test all connections
   */
  async testAllConnections(): Promise<AllConnectionsTestResult> {
    const response = await api.post('/settings/test/all');
    return response.data.data;
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<ConnectionTestResult> {
    const response = await api.post('/settings/test/send-email', {
      email,
    });
    return response.data.data;
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<SystemSettings> {
    const response = await api.post('/settings/reset');
    return response.data.data;
  }

  /**
   * Export settings
   */
  async exportSettings(): Promise<{
    exportDate: string;
    version: string;
    settings: SystemSettings;
  }> {
    const response = await api.get('/settings/export');
    return response.data.data;
  }

  /**
   * Import settings
   */
  async importSettings(importData: {
    settings: Partial<SystemSettings>;
  }): Promise<SystemSettings> {
    const response = await api.post('/settings/import', importData);
    return response.data.data;
  }

  /**
   * Get accessible categories for current user
   */
  async getAccessibleCategories(): Promise<string[]> {
    const response = await api.get('/settings/accessible-categories');
    return response.data.data;
  }

  /**
   * Get role permissions configuration
   */
  async getRolePermissions(): Promise<Record<string, string[]>> {
    const response = await api.get('/settings/role-permissions');
    return response.data.data;
  }

  /**
   * Update role permissions for a category (admin only)
   */
  async updateRolePermissions(
    category: 'security' | 'database' | 'email' | 'application',
    roles: string[]
  ): Promise<Record<string, string[]>> {
    const response = await api.put('/settings/role-permissions', {
      category,
      roles,
    });
    return response.data.data;
  }
}

export default new SettingsService();
