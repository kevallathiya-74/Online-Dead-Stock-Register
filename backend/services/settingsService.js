const Settings = require('../models/settings');
const SettingsHistory = require('../models/settingsHistory');
const connectionTester = require('../utils/connectionTester');
const logger = require('../utils/logger');

class SettingsService {
  /**
   * Get current settings
   */
  async getSettings(includePassword = false, userRole = null) {
    try {
      let settings;
      
      // If role is provided, filter by role access
      if (userRole) {
        settings = await Settings.getFilteredSettings(userRole);
      } else {
        settings = await Settings.getInstance();
        settings = settings.toObject();
      }
      
      if (!includePassword) {
        if (settings.email && settings.email.smtpPassword) {
          settings.email.smtpPassword = '••••••••';
        }
        return settings;
      }
      
      // Include password for internal operations (admin only)
      if (userRole === 'ADMIN' || !userRole) {
        const settingsWithPassword = await Settings.findOne().select('+email.smtpPassword');
        return settingsWithPassword ? settingsWithPassword.toObject() : settings;
      }
      
      return settings;
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update settings with audit logging
   */
  async updateSettings(updates, userId, ipAddress, userAgent) {
    try {
      const oldSettings = await Settings.getInstance();
      const oldSettingsObj = oldSettings.toObject();

      // Update settings
      const newSettings = await Settings.updateSettings(updates, userId);

      // Log changes for each category
      const categories = ['security', 'database', 'email', 'application'];
      
      for (const category of categories) {
        if (updates[category]) {
          for (const [field, newValue] of Object.entries(updates[category])) {
            const oldValue = oldSettingsObj[category]?.[field];
            
            // Skip password fields in history (security)
            if (field === 'smtpPassword') {
              await SettingsHistory.logChange({
                category,
                field,
                oldValue: '••••••••',
                newValue: '••••••••',
                userId,
                ipAddress,
                userAgent,
              });
            } else {
              await SettingsHistory.logChange({
                category,
                field,
                oldValue,
                newValue,
                userId,
                ipAddress,
                userAgent,
              });
            }
          }
        }
      }

      return newSettings;
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Partial update of specific category
   */
  async updateCategory(category, updates, userId, ipAddress, userAgent) {
    const validCategories = ['security', 'database', 'email', 'application'];
    
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    return await this.updateSettings({ [category]: updates }, userId, ipAddress, userAgent);
  }

  /**
   * Search settings
   */
  async searchSettings(query) {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const results = await Settings.searchSettings(query);
      return results;
    } catch (error) {
      logger.error('Error searching settings:', error);
      throw error;
    }
  }

  /**
   * Get settings history
   */
  async getHistory(filters = {}) {
    try {
      return await SettingsHistory.getHistory(filters);
    } catch (error) {
      logger.error('Error getting settings history:', error);
      throw error;
    }
  }

  /**
   * Get recent changes
   */
  async getRecentChanges(limit = 10) {
    try {
      return await SettingsHistory.getRecentChanges(limit);
    } catch (error) {
      logger.error('Error getting recent changes:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(connectionString = null) {
    try {
      return await connectionTester.testDatabaseConnection(connectionString);
    } catch (error) {
      logger.error('Error testing database connection:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      };
    }
  }

  /**
   * Test email connection
   */
  async testEmailConnection(emailConfig = null) {
    try {
      // If no config provided, use current settings
      if (!emailConfig) {
        const settings = await this.getSettings(true);
        emailConfig = {
          host: settings.email.smtpHost,
          port: settings.email.smtpPort,
          secure: settings.email.smtpSecure,
          auth: {
            user: settings.email.smtpUser,
            pass: settings.email.smtpPassword,
          },
        };
      }

      return await connectionTester.testEmailConnection(emailConfig);
    } catch (error) {
      logger.error('Error testing email connection:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      };
    }
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(redisUrl = null) {
    try {
      return await connectionTester.testRedisConnection(redisUrl);
    } catch (error) {
      logger.error('Error testing Redis connection:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      };
    }
  }

  /**
   * Test all connections
   */
  async testAllConnections() {
    try {
      const settings = await this.getSettings(true);
      
      const config = {
        email: {
          host: settings.email.smtpHost,
          port: settings.email.smtpPort,
          secure: settings.email.smtpSecure,
          auth: {
            user: settings.email.smtpUser,
            pass: settings.email.smtpPassword,
          },
        },
      };

      return await connectionTester.testAllConnections(config);
    } catch (error) {
      logger.error('Error testing all connections:', error);
      return {
        success: false,
        message: 'Connection tests failed',
        error: error.message,
        results: {},
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(testAddress) {
    try {
      const settings = await this.getSettings(true);
      
      const emailConfig = {
        smtpHost: settings.email.smtpHost,
        smtpPort: settings.email.smtpPort,
        smtpSecure: settings.email.smtpSecure,
        smtpUser: settings.email.smtpUser,
        smtpPassword: settings.email.smtpPassword,
        fromEmail: settings.email.fromEmail,
        fromName: settings.email.fromName,
      };

      return await connectionTester.sendTestEmail(emailConfig, testAddress);
    } catch (error) {
      logger.error('Error sending test email:', error);
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(userId, ipAddress, userAgent) {
    try {
      const settings = await Settings.getInstance();
      
      // Store old settings
      const oldSettings = settings.toObject();

      // Create new settings with defaults
      await Settings.deleteMany({});
      const newSettings = await Settings.create({
        lastModifiedBy: userId,
      });

      // Log the reset
      await SettingsHistory.logChange({
        category: 'all',
        field: 'settings_reset',
        oldValue: 'custom_settings',
        newValue: 'default_settings',
        userId,
        ipAddress,
        userAgent,
        reason: 'Settings reset to defaults',
      });

      return newSettings;
    } catch (error) {
      logger.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Export settings
   */
  async exportSettings() {
    try {
      const settings = await this.getSettings(false);
      return {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        settings,
      };
    } catch (error) {
      logger.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings
   */
  async importSettings(importData, userId, ipAddress, userAgent) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data');
      }

      // Validate and update
      return await this.updateSettings(importData.settings, userId, ipAddress, userAgent);
    } catch (error) {
      logger.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Get accessible categories for a role
   */
  async getAccessibleCategories(userRole) {
    try {
      return await Settings.getAccessibleCategories(userRole);
    } catch (error) {
      logger.error('Error getting accessible categories:', error);
      throw error;
    }
  }

  /**
   * Check if role has access to category
   */
  async hasAccess(userRole, category) {
    try {
      return await Settings.hasAccess(userRole, category);
    } catch (error) {
      logger.error('Error checking access:', error);
      throw error;
    }
  }

  /**
   * Get role permissions configuration
   */
  async getRolePermissions() {
    try {
      const settings = await Settings.getInstance();
      return settings.rolePermissions || {
        security: ['ADMIN'],
        database: ['ADMIN'],
        email: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'],
        application: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'],
      };
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      throw error;
    }
  }

  /**
   * Update role permissions for a category
   */
  async updateRolePermissions(category, roles, userId, ipAddress, userAgent) {
    try {
      const oldSettings = await Settings.getInstance();
      const oldPermissions = oldSettings.rolePermissions?.[category] || [];

      const settings = await Settings.updateRolePermissions(category, roles);

      // Log the change
      await SettingsHistory.logChange({
        category: 'rolePermissions',
        field: category,
        oldValue: oldPermissions,
        newValue: roles,
        userId,
        ipAddress,
        userAgent,
        reason: 'Role permissions updated',
      });

      return settings.rolePermissions;
    } catch (error) {
      logger.error('Error updating role permissions:', error);
      throw error;
    }
  }
}

module.exports = new SettingsService();
