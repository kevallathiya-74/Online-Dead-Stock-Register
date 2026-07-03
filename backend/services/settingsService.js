const connectionTester = require("../utils/connectionTester");
const logger = require("../utils/logger");
const getSupabase = require("../config/db");

class SettingsService {
  /**
   * Get current settings
   */
  async getSettings(includePassword = false, userRole = null) {
    try {
      const supabase = getSupabase();

      const { data: settingsRow, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      let settings = settingsRow || {
        security: {},
        database: {},
        email: {},
        application: {},
        rolePermissions: {
          security: ["ADMIN"],
          database: ["ADMIN"],
          email: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
          application: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
        },
      };

      // If role is provided, filter by role access
      if (userRole) {
        // Implement role filtering
        const rolePermissions = settings.rolePermissions || {};
        const filteredSettings = {};

        ["security", "database", "email", "application"].forEach((category) => {
          const allowedRoles = rolePermissions[category] || ["ADMIN"];
          if (allowedRoles.includes(userRole)) {
            filteredSettings[category] = settings[category] || {};
          }
        });

        filteredSettings.rolePermissions = settings.rolePermissions;
        settings = filteredSettings;
      }

      if (!includePassword) {
        if (settings.email && settings.email.smtpPassword) {
          settings.email.smtpPassword = "••••••••";
        }
        return settings;
      }

      return settings;
    } catch (error) {
      logger.error("Error getting settings:", error);
      throw error;
    }
  }

  /**
   * Update settings with audit logging
   */
  async updateSettings(updates, userId, ipAddress, userAgent) {
    try {
      const supabase = getSupabase();
      const oldSettings = await this.getSettings(true);

      const { data: currentSettings } = await supabase
        .from("settings")
        .select("id")
        .limit(1)
        .single();

      let newSettingsObj = { ...oldSettings };

      // Merge updates
      const categories = ["security", "database", "email", "application"];
      for (const category of categories) {
        if (updates[category]) {
          newSettingsObj[category] = {
            ...(newSettingsObj[category] || {}),
            ...updates[category],
          };
        }
      }

      newSettingsObj.last_modified_by = userId;
      newSettingsObj.updated_at = new Date().toISOString();

      let newSettings;

      if (currentSettings) {
        const { data, error } = await supabase
          .from("settings")
          .update(newSettingsObj)
          .eq("id", currentSettings.id)
          .select()
          .single();
        if (error) throw error;
        newSettings = data;
      } else {
        const { data, error } = await supabase
          .from("settings")
          .insert(newSettingsObj)
          .select()
          .single();
        if (error) throw error;
        newSettings = data;
      }

      // Log changes for each category
      for (const category of categories) {
        if (updates[category]) {
          for (const [field, newValue] of Object.entries(updates[category])) {
            const oldValue = oldSettings[category]?.[field];

            // Skip password fields in history (security)
            if (field === "smtpPassword") {
              await supabase.from("settings_history").insert({
                category,
                field,
                old_value: "••••••••",
                new_value: "••••••••",
                user_id: userId,
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
              });
            } else {
              await supabase.from("settings_history").insert({
                category,
                field,
                old_value: JSON.stringify(oldValue),
                new_value: JSON.stringify(newValue),
                user_id: userId,
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      return newSettings;
    } catch (error) {
      logger.error("Error updating settings:", error);
      throw error;
    }
  }

  /**
   * Partial update of specific category
   */
  async updateCategory(category, updates, userId, ipAddress, userAgent) {
    const validCategories = ["security", "database", "email", "application"];

    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    return await this.updateSettings(
      { [category]: updates },
      userId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Search settings
   */
  async searchSettings(query) {
    try {
      if (!query || query.trim() === "") {
        return [];
      }

      const settings = await this.getSettings();
      const results = [];

      const searchObj = (obj, path = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === "object" && value !== null) {
            searchObj(value, currentPath);
          } else {
            const strValue = String(value).toLowerCase();
            const strKey = String(key).toLowerCase();
            const searchTerm = query.toLowerCase();

            if (strValue.includes(searchTerm) || strKey.includes(searchTerm)) {
              results.push({
                path: currentPath,
                key,
                value,
              });
            }
          }
        }
      };

      searchObj(settings);
      return results;
    } catch (error) {
      logger.error("Error searching settings:", error);
      throw error;
    }
  }

  /**
   * Get settings history
   */
  async getHistory(filters = {}) {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("settings_history")
        .select("*, user:users(id, name, email)");

      if (filters.category) query = query.eq("category", filters.category);
      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.startDate)
        query = query.gte(
          "created_at",
          new Date(filters.startDate).toISOString(),
        );
      if (filters.endDate)
        query = query.lte(
          "created_at",
          new Date(filters.endDate).toISOString(),
        );

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting settings history:", error);
      throw error;
    }
  }

  /**
   * Get recent changes
   */
  async getRecentChanges(limit = 10) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("settings_history")
        .select("*, user:users(id, name, email)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting recent changes:", error);
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
      logger.error("Error testing database connection:", error);
      return {
        success: false,
        message: "Connection test failed",
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
        if (!settings.email || !settings.email.smtpHost) {
          throw new Error("Email settings not configured");
        }

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
      logger.error("Error testing email connection:", error);
      return {
        success: false,
        message: "Connection test failed",
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
      logger.error("Error testing Redis connection:", error);
      return {
        success: false,
        message: "Connection test failed",
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
        email:
          settings.email && settings.email.smtpHost
            ? {
                host: settings.email.smtpHost,
                port: settings.email.smtpPort,
                secure: settings.email.smtpSecure,
                auth: {
                  user: settings.email.smtpUser,
                  pass: settings.email.smtpPassword,
                },
              }
            : null,
      };

      return await connectionTester.testAllConnections(config);
    } catch (error) {
      logger.error("Error testing all connections:", error);
      return {
        success: false,
        message: "Connection tests failed",
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

      if (!settings.email || !settings.email.smtpHost) {
        throw new Error("Email settings not configured");
      }

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
      logger.error("Error sending test email:", error);
      return {
        success: false,
        message: "Failed to send test email",
        error: error.message,
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(userId, ipAddress, userAgent) {
    try {
      const supabase = getSupabase();

      // Delete existing settings
      const { error: deleteError } = await supabase
        .from("settings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
      if (deleteError) throw deleteError;

      // Create new settings with defaults
      const defaultSettings = {
        last_modified_by: userId,
        security: {},
        database: {},
        email: {},
        application: {},
        rolePermissions: {
          security: ["ADMIN"],
          database: ["ADMIN"],
          email: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
          application: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the reset
      await supabase.from("settings_history").insert({
        category: "all",
        field: "settings_reset",
        old_value: "custom_settings",
        new_value: "default_settings",
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        reason: "Settings reset to defaults",
        created_at: new Date().toISOString(),
      });

      return newSettings;
    } catch (error) {
      logger.error("Error resetting settings:", error);
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
        version: "1.0.0",
        settings,
      };
    } catch (error) {
      logger.error("Error exporting settings:", error);
      throw error;
    }
  }

  /**
   * Import settings
   */
  async importSettings(importData, userId, ipAddress, userAgent) {
    try {
      if (!importData.settings) {
        throw new Error("Invalid import data");
      }

      // Validate and update
      return await this.updateSettings(
        importData.settings,
        userId,
        ipAddress,
        userAgent,
      );
    } catch (error) {
      logger.error("Error importing settings:", error);
      throw error;
    }
  }

  /**
   * Get accessible categories for a role
   */
  async getAccessibleCategories(userRole) {
    try {
      const settings = await this.getSettings();
      const rolePermissions = settings.rolePermissions || {};

      return Object.keys(rolePermissions).filter((category) => {
        const allowedRoles = rolePermissions[category] || [];
        return allowedRoles.includes(userRole);
      });
    } catch (error) {
      logger.error("Error getting accessible categories:", error);
      throw error;
    }
  }

  /**
   * Check if role has access to category
   */
  async hasAccess(userRole, category) {
    try {
      const settings = await this.getSettings();
      const rolePermissions = settings.rolePermissions || {};
      const allowedRoles = rolePermissions[category] || ["ADMIN"];
      return allowedRoles.includes(userRole);
    } catch (error) {
      logger.error("Error checking access:", error);
      throw error;
    }
  }

  /**
   * Get role permissions configuration
   */
  async getRolePermissions() {
    try {
      const settings = await this.getSettings();
      return (
        settings.rolePermissions || {
          security: ["ADMIN"],
          database: ["ADMIN"],
          email: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
          application: ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"],
        }
      );
    } catch (error) {
      logger.error("Error getting role permissions:", error);
      throw error;
    }
  }

  /**
   * Update role permissions for a category
   */
  async updateRolePermissions(category, roles, userId, ipAddress, userAgent) {
    try {
      const supabase = getSupabase();
      const oldSettings = await this.getSettings();
      const oldPermissions = oldSettings.rolePermissions?.[category] || [];

      const newRolePermissions = { ...(oldSettings.rolePermissions || {}) };
      newRolePermissions[category] = roles;

      const { data: currentSettings } = await supabase
        .from("settings")
        .select("id")
        .limit(1)
        .single();

      if (currentSettings) {
        await supabase
          .from("settings")
          .update({
            rolePermissions: newRolePermissions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSettings.id);
      } else {
        await supabase.from("settings").insert({
          rolePermissions: newRolePermissions,
          updated_at: new Date().toISOString(),
        });
      }

      // Log the change
      await supabase.from("settings_history").insert({
        category: "rolePermissions",
        field: category,
        old_value: JSON.stringify(oldPermissions),
        new_value: JSON.stringify(roles),
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        reason: "Role permissions updated",
        created_at: new Date().toISOString(),
      });

      return newRolePermissions;
    } catch (error) {
      logger.error("Error updating role permissions:", error);
      throw error;
    }
  }
}

module.exports = new SettingsService();
