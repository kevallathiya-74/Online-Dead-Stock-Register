const Settings = require('../models/settings');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has access to specific settings category
 */
const authorizeSettingsCategory = (category) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User role not found',
        });
      }

      // Check if role has access to the category
      const hasAccess = await Settings.hasAccess(userRole, category);

      if (!hasAccess) {
        logger.warn(`Access denied: User ${req.user._id} (${userRole}) attempted to access ${category} settings`);
        return res.status(403).json({
          success: false,
          message: `Your role (${userRole}) does not have access to ${category} settings`,
          requiredPermission: category,
        });
      }

      next();
    } catch (error) {
      logger.error('Error in authorizeSettingsCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware to check if user can modify role permissions
 * Only admin can modify role permissions
 */
const authorizeRolePermissionManagement = (req, res, next) => {
  const userRole = req.user?.role;

  if (userRole !== 'ADMIN') {
    logger.warn(`Access denied: User ${req.user._id} (${userRole}) attempted to modify role permissions`);
    return res.status(403).json({
      success: false,
      message: 'Only admin can modify role permissions',
      requiredRole: 'ADMIN',
    });
  }

  next();
};

/**
 * Middleware to validate that user has access to at least one category in the update
 */
const validateSettingsUpdateAccess = async (req, res, next) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'User role not found',
      });
    }

    const updates = req.body;
    const categories = Object.keys(updates).filter(key => 
      ['security', 'database', 'email', 'application'].includes(key)
    );

    if (categories.length === 0) {
      return next(); // No category updates, allow to proceed
    }

    // Check if user has access to ALL categories they're trying to update
    const accessChecks = await Promise.all(
      categories.map(category => Settings.hasAccess(userRole, category))
    );

    const deniedCategories = categories.filter((_, index) => !accessChecks[index]);

    if (deniedCategories.length > 0) {
      logger.warn(`Access denied: User ${req.user._id} (${userRole}) attempted to update restricted categories: ${deniedCategories.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Your role (${userRole}) does not have access to: ${deniedCategories.join(', ')}`,
        deniedCategories,
      });
    }

    next();
  } catch (error) {
    logger.error('Error in validateSettingsUpdateAccess:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking permissions',
      error: error.message,
    });
  }
};

module.exports = {
  authorizeSettingsCategory,
  authorizeRolePermissionManagement,
  validateSettingsUpdateAccess,
};
