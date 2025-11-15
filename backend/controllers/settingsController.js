const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');

/**
 * SYSTEM SETTINGS CONTROLLER
 * Manages system-wide configuration settings with MongoDB persistence
 */

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const settings = await settingsService.getSettings(false, userRole);

    res.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully',
    });
  } catch (error) {
    logger.error('Error in getSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message,
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const settings = await settingsService.updateSettings(updates, userId, ipAddress, userAgent);

    // Sanitize password in response
    const response = settings.toObject();
    if (response.email && response.email.smtpPassword) {
      response.email.smtpPassword = '••••••••';
    }

    res.json({
      success: true,
      data: response,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    logger.error('Error in updateSettings:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

// Update specific category
exports.updateCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const updates = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const settings = await settingsService.updateCategory(category, updates, userId, ipAddress, userAgent);

    // Sanitize password in response
    const response = settings.toObject();
    if (response.email && response.email.smtpPassword) {
      response.email.smtpPassword = '••••••••';
    }

    res.json({
      success: true,
      data: response,
      message: `${category} settings updated successfully`,
    });
  } catch (error) {
    logger.error('Error in updateCategory:', error);
    
    if (error.message.includes('Invalid category')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category settings',
      error: error.message,
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
        message: 'Search query is required',
      });
    }

    const results = await settingsService.searchSettings(query);

    res.json({
      success: true,
      data: results,
      count: results.length,
      message: 'Search completed successfully',
    });
  } catch (error) {
    logger.error('Error in searchSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
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

    res.json({
      success: true,
      data: result.history,
      pagination: result.pagination,
      message: 'History retrieved successfully',
    });
  } catch (error) {
    logger.error('Error in getHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve history',
      error: error.message,
    });
  }
};

// Get recent changes
exports.getRecentChanges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const changes = await settingsService.getRecentChanges(limit);

    res.json({
      success: true,
      data: changes,
      message: 'Recent changes retrieved successfully',
    });
  } catch (error) {
    logger.error('Error in getRecentChanges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent changes',
      error: error.message,
    });
  }
};

// Test database connection
exports.testDatabaseConnection = async (req, res) => {
  try {
    const { connectionString } = req.body;
    const result = await settingsService.testDatabaseConnection(connectionString);

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in testDatabaseConnection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
};

// Test email connection
exports.testEmailConnection = async (req, res) => {
  try {
    const emailConfig = req.body.emailConfig || null;
    const result = await settingsService.testEmailConnection(emailConfig);

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in testEmailConnection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
};

// Test Redis connection
exports.testRedisConnection = async (req, res) => {
  try {
    const { redisUrl } = req.body;
    const result = await settingsService.testRedisConnection(redisUrl);

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in testRedisConnection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
};

// Test all connections
exports.testAllConnections = async (req, res) => {
  try {
    const result = await settingsService.testAllConnections();

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in testAllConnections:', error);
    res.status(500).json({
      success: false,
      message: 'Connection tests failed',
      error: error.message,
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
        message: 'Email address is required',
      });
    }

    const result = await settingsService.sendTestEmail(email);

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in sendTestEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
};

// Reset settings to defaults
exports.resetToDefaults = async (req, res) => {
  try {
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const settings = await settingsService.resetToDefaults(userId, ipAddress, userAgent);

    res.json({
      success: true,
      data: settings,
      message: 'Settings reset to defaults successfully',
    });
  } catch (error) {
    logger.error('Error in resetToDefaults:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message,
    });
  }
};

// Export settings
exports.exportSettings = async (req, res) => {
  try {
    const exportData = await settingsService.exportSettings();

    res.json({
      success: true,
      data: exportData,
      message: 'Settings exported successfully',
    });
  } catch (error) {
    logger.error('Error in exportSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: error.message,
    });
  }
};

// Import settings
exports.importSettings = async (req, res) => {
  try {
    const importData = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const settings = await settingsService.importSettings(importData, userId, ipAddress, userAgent);

    res.json({
      success: true,
      data: settings,
      message: 'Settings imported successfully',
    });
  } catch (error) {
    logger.error('Error in importSettings:', error);
    
    if (error.message.includes('Invalid import data')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: error.message,
    });
  }
};

// Get accessible categories for current user
exports.getAccessibleCategories = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const categories = await settingsService.getAccessibleCategories(userRole);

    res.json({
      success: true,
      data: categories,
      message: 'Accessible categories retrieved successfully',
    });
  } catch (error) {
    logger.error('Error in getAccessibleCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve accessible categories',
      error: error.message,
    });
  }
};

// Get role permissions configuration
exports.getRolePermissions = async (req, res) => {
  try {
    const permissions = await settingsService.getRolePermissions();

    res.json({
      success: true,
      data: permissions,
      message: 'Role permissions retrieved successfully',
    });
  } catch (error) {
    logger.error('Error in getRolePermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role permissions',
      error: error.message,
    });
  }
};

// Update role permissions
exports.updateRolePermissions = async (req, res) => {
  try {
    const { category, roles } = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    if (!category || !roles || !Array.isArray(roles)) {
      return res.status(400).json({
        success: false,
        message: 'Category and roles array are required',
      });
    }

    const validCategories = ['security', 'database', 'email', 'application'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    const permissions = await settingsService.updateRolePermissions(
      category,
      roles,
      userId,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: permissions,
      message: 'Role permissions updated successfully',
    });
  } catch (error) {
    logger.error('Error in updateRolePermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role permissions',
      error: error.message,
    });
  }
};
