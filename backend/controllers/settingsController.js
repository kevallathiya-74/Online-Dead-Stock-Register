const settingsService = require("../services/settingsService");
const logger = require("../utils/logger");

/**
 * SYSTEM SETTINGS CONTROLLER
 * Manages system-wide configuration settings with Supabase persistence
 */

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const settings = await settingsService.getSettings(false, userRole);

    return res.json({
      success: true,
      data: settings,
      message: "Settings retrieved successfully",
    });
  } catch (error) {
    logger.error("Error in getSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve settings",
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user.id;
    const ipAddress =
      req.clientIp || req.ip || req.connection?.remoteAddress || "Unknown";
    const userAgent = req.get("user-agent") || "Unknown";

    const settings = await settingsService.updateSettings(
      updates,
      userId,
      ipAddress,
      userAgent,
    );

    // Sanitize password in response
    const response = { ...settings };
    if (response.email && response.email.smtpPassword) {
      response.email = { ...response.email, smtpPassword: "••••••••" };
    }

    return res.json({
      success: true,
      data: response,
      message: "Settings updated successfully",
    });
  } catch (error) {
    logger.error("Error in updateSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

// Update specific category
exports.updateCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const updates = req.body;
    const userId = req.user.id || req.user._id;
    const ipAddress =
      req.clientIp || req.ip || req.connection?.remoteAddress || "Unknown";
    const userAgent = req.get("user-agent") || "Unknown";

    const settings = await settingsService.updateCategory(
      category,
      updates,
      userId,
      ipAddress,
      userAgent,
    );

    // Sanitize password in response
    const response = { ...settings };
    if (response.email && response.email.smtpPassword) {
      response.email = { ...response.email, smtpPassword: "••••••••" };
    }

    return res.json({
      success: true,
      data: response,
      message: `${category} settings updated successfully`,
    });
  } catch (error) {
    logger.error("Error in updateCategory:", error);

    if (error.message && error.message.includes("Invalid category")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category settings",
    });
  }
};

// Search settings
exports.searchSettings = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await settingsService.searchSettings(query);

    return res.json({
      success: true,
      data: results,
      count: results.length,
      message: "Search completed successfully",
    });
  } catch (error) {
    logger.error("Error in searchSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

// Get settings history
exports.getHistory = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      field: req.query.field,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50,
    };

    const result = await settingsService.getHistory(filters);

    return res.json({
      success: true,
      data: result.history,
      pagination: result.pagination,
      message: "History retrieved successfully",
    });
  } catch (error) {
    logger.error("Error in getHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve history",
    });
  }
};

// Get recent changes
exports.getRecentChanges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const changes = await settingsService.getRecentChanges(limit);

    return res.json({
      success: true,
      data: changes,
      message: "Recent changes retrieved successfully",
    });
  } catch (error) {
    logger.error("Error in getRecentChanges:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve recent changes",
    });
  }
};

// Test database connection
exports.testDatabaseConnection = async (req, res) => {
  try {
    const { connectionString } = req.body;
    const result =
      await settingsService.testDatabaseConnection(connectionString);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in testDatabaseConnection:", error);
    return res.status(500).json({
      success: false,
      message: "Connection test failed",
    });
  }
};

// Test email connection
exports.testEmailConnection = async (req, res) => {
  try {
    const emailConfig = req.body.emailConfig || null;
    const result = await settingsService.testEmailConnection(emailConfig);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in testEmailConnection:", error);
    return res.status(500).json({
      success: false,
      message: "Connection test failed",
    });
  }
};

// Test Redis connection
exports.testRedisConnection = async (req, res) => {
  try {
    const { redisUrl } = req.body;
    const result = await settingsService.testRedisConnection(redisUrl);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in testRedisConnection:", error);
    return res.status(500).json({
      success: false,
      message: "Connection test failed",
    });
  }
};

// Test all connections
exports.testAllConnections = async (req, res) => {
  try {
    const result = await settingsService.testAllConnections();

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in testAllConnections:", error);
    return res.status(500).json({
      success: false,
      message: "Connection tests failed",
    });
  }
};

// Send test email
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const result = await settingsService.sendTestEmail(email);

    return res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in sendTestEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
    });
  }
};

// Reset settings to defaults
exports.resetToDefaults = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const ipAddress =
      req.clientIp || req.ip || req.connection?.remoteAddress || "Unknown";
    const userAgent = req.get("user-agent") || "Unknown";

    const settings = await settingsService.resetToDefaults(
      userId,
      ipAddress,
      userAgent,
    );

    return res.json({
      success: true,
      data: settings,
      message: "Settings reset to defaults successfully",
    });
  } catch (error) {
    logger.error("Error in resetToDefaults:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset settings",
    });
  }
};

// Export settings
exports.exportSettings = async (req, res) => {
  try {
    const exportData = await settingsService.exportSettings();

    return res.json({
      success: true,
      data: exportData,
      message: "Settings exported successfully",
    });
  } catch (error) {
    logger.error("Error in exportSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export settings",
    });
  }
};

// Import settings
exports.importSettings = async (req, res) => {
  try {
    const importData = req.body;
    const userId = req.user.id || req.user._id;
    const ipAddress =
      req.clientIp || req.ip || req.connection?.remoteAddress || "Unknown";
    const userAgent = req.get("user-agent") || "Unknown";

    const settings = await settingsService.importSettings(
      importData,
      userId,
      ipAddress,
      userAgent,
    );

    return res.json({
      success: true,
      data: settings,
      message: "Settings imported successfully",
    });
  } catch (error) {
    logger.error("Error in importSettings:", error);

    if (error.message && error.message.includes("Invalid import data")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to import settings",
    });
  }
};

// Get accessible categories for current user
exports.getAccessibleCategories = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const categories = await settingsService.getAccessibleCategories(userRole);

    return res.json({
      success: true,
      data: categories,
      message: "Accessible categories retrieved successfully",
    });
  } catch (error) {
    logger.error("Error in getAccessibleCategories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve accessible categories",
    });
  }
};

// Get role permissions configuration
exports.getRolePermissions = async (req, res) => {
  try {
    const permissions = await settingsService.getRolePermissions();

    return res.json({
      success: true,
      data: permissions,
      message: "Role permissions retrieved successfully",
    });
  } catch (error) {
    logger.error("Error in getRolePermissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role permissions",
    });
  }
};

// Update role permissions
exports.updateRolePermissions = async (req, res) => {
  try {
    const { category, roles } = req.body;
    const userId = req.user.id || req.user._id;
    const ipAddress =
      req.clientIp || req.ip || req.connection?.remoteAddress || "Unknown";
    const userAgent = req.get("user-agent") || "Unknown";

    if (!category || !roles || !Array.isArray(roles)) {
      return res.status(400).json({
        success: false,
        message: "Category and roles array are required",
      });
    }

    const validCategories = ["security", "database", "email", "application"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const permissions = await settingsService.updateRolePermissions(
      category,
      roles,
      userId,
      ipAddress,
      userAgent,
    );

    return res.json({
      success: true,
      data: permissions,
      message: "Role permissions updated successfully",
    });
  } catch (error) {
    logger.error("Error in updateRolePermissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update role permissions",
    });
  }
};
