const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const {
  validateSettingsUpdateAccess,
  authorizeSettingsCategory,
  authorizeRolePermissionManagement,
} = require('../middleware/settingsAuthMiddleware');

/**
 * SETTINGS ROUTES
 * Role-based access control applied
 */

// Apply authentication to all routes
router.use(authMiddleware);

// GET /api/v1/settings - Get all settings (filtered by role)
router.get('/', settingsController.getSettings);

// GET /api/v1/settings/accessible-categories - Get categories accessible to current user
router.get('/accessible-categories', settingsController.getAccessibleCategories);

// PUT /api/v1/settings - Update all settings
router.put(
  '/',
  [
    validateSettingsUpdateAccess, // Check role access before validation
    // Security validation
    body('security.sessionTimeout')
      .optional()
      .isInt({ min: 5, max: 1440 })
      .withMessage('Session timeout must be between 5 and 1440 minutes'),
    body('security.passwordExpiry')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Password expiry must be between 0 and 365 days'),
    body('security.maxLoginAttempts')
      .optional()
      .isInt({ min: 3, max: 10 })
      .withMessage('Max login attempts must be between 3 and 10'),
    body('security.twoFactorAuth')
      .optional()
      .isBoolean()
      .withMessage('Two-factor auth must be a boolean'),
    body('security.passwordMinLength')
      .optional()
      .isInt({ min: 6, max: 32 })
      .withMessage('Password minimum length must be between 6 and 32'),
    body('security.requireSpecialChar')
      .optional()
      .isBoolean()
      .withMessage('Require special char must be a boolean'),
    body('security.requireNumber')
      .optional()
      .isBoolean()
      .withMessage('Require number must be a boolean'),
    body('security.requireUppercase')
      .optional()
      .isBoolean()
      .withMessage('Require uppercase must be a boolean'),

    // Database validation
    body('database.backupEnabled')
      .optional()
      .isBoolean()
      .withMessage('Backup enabled must be a boolean'),
    body('database.backupFrequency')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Backup frequency must be daily, weekly, or monthly'),
    body('database.backupRetention')
      .optional()
      .isInt({ min: 7, max: 365 })
      .withMessage('Backup retention must be between 7 and 365 days'),
    body('database.backupLocation')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Backup location is required'),
    body('database.connectionPoolSize')
      .optional()
      .isInt({ min: 5, max: 100 })
      .withMessage('Connection pool size must be between 5 and 100'),
    body('database.queryTimeout')
      .optional()
      .isInt({ min: 5000, max: 300000 })
      .withMessage('Query timeout must be between 5000ms and 300000ms'),

    // Email validation
    body('email.smtpHost')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('SMTP host is required'),
    body('email.smtpPort')
      .optional()
      .isInt({ min: 1, max: 65535 })
      .withMessage('SMTP port must be between 1 and 65535'),
    body('email.smtpSecure')
      .optional()
      .isBoolean()
      .withMessage('SMTP secure must be a boolean'),
    body('email.smtpUser')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('SMTP user is required'),
    body('email.smtpPassword')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('SMTP password is required'),
    body('email.fromEmail')
      .optional()
      .trim()
      .isEmail()
      .withMessage('From email must be a valid email address'),
    body('email.fromName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('From name is required'),
    body('email.enableNotifications')
      .optional()
      .isBoolean()
      .withMessage('Enable notifications must be a boolean'),

    // Application validation
    body('application.appName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('App name must be between 3 and 100 characters'),
    body('application.appVersion')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('App version is required'),
    body('application.timezone')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Timezone is required'),
    body('application.dateFormat')
      .optional()
      .isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
      .withMessage('Date format must be MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD'),
    body('application.currency')
      .optional()
      .trim()
      .isLength({ min: 3, max: 3 })
      .isUppercase()
      .withMessage('Currency must be a 3-letter uppercase code'),
    body('application.language')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Language is required'),
    body('application.itemsPerPage')
      .optional()
      .isInt({ min: 5, max: 100 })
      .withMessage('Items per page must be between 5 and 100'),
    body('application.maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('Maintenance mode must be a boolean'),
    body('application.maintenanceMessage')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Maintenance message cannot exceed 500 characters'),

    handleValidationErrors,
  ],
  settingsController.updateSettings
);

// PATCH /api/v1/settings/:category - Update specific category
router.patch(
  '/:category',
  [
    param('category')
      .isIn(['security', 'database', 'email', 'application'])
      .withMessage('Invalid category'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    // Dynamic authorization based on category parameter
    const category = req.params.category;
    const authMiddleware = authorizeSettingsCategory(category);
    await authMiddleware(req, res, next);
  },
  settingsController.updateCategory
);

// GET /api/v1/settings/search - Search settings
router.get(
  '/search',
  [
    query('query')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
    handleValidationErrors,
  ],
  settingsController.searchSettings
);

// GET /api/v1/settings/history - Get settings change history
router.get(
  '/history',
  [
    query('category')
      .optional()
      .isIn(['security', 'database', 'email', 'application', 'all'])
      .withMessage('Invalid category'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  settingsController.getHistory
);

// GET /api/v1/settings/history/recent - Get recent changes
router.get(
  '/history/recent',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    handleValidationErrors,
  ],
  settingsController.getRecentChanges
);

// POST /api/v1/settings/test/database - Test database connection
router.post(
  '/test/database',
  [
    body('connectionString')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Connection string cannot be empty'),
    handleValidationErrors,
  ],
  settingsController.testDatabaseConnection
);

// POST /api/v1/settings/test/email - Test email connection
router.post('/test/email', settingsController.testEmailConnection);

// POST /api/v1/settings/test/redis - Test Redis connection
router.post(
  '/test/redis',
  [
    body('redisUrl')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Redis URL cannot be empty'),
    handleValidationErrors,
  ],
  settingsController.testRedisConnection
);

// POST /api/v1/settings/test/all - Test all connections
router.post('/test/all', settingsController.testAllConnections);

// POST /api/v1/settings/test/send-email - Send test email
router.post(
  '/test/send-email',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Email must be a valid email address'),
    handleValidationErrors,
  ],
  settingsController.sendTestEmail
);

// POST /api/v1/settings/reset - Reset settings to defaults
router.post('/reset', requireRole(['ADMIN']), settingsController.resetToDefaults);

// GET /api/v1/settings/export - Export settings
router.get('/export', settingsController.exportSettings);

// POST /api/v1/settings/import - Import settings
router.post(
  '/import',
  [
    requireRole(['ADMIN']),
    body('settings')
      .exists()
      .withMessage('Settings data is required'),
    handleValidationErrors,
  ],
  settingsController.importSettings
);

// GET /api/v1/settings/role-permissions - Get role permissions configuration
router.get('/role-permissions', requireRole(['ADMIN']), settingsController.getRolePermissions);

// PUT /api/v1/settings/role-permissions - Update role permissions (admin only)
router.put(
  '/role-permissions',
  [
    authorizeRolePermissionManagement,
    body('category')
      .isIn(['security', 'database', 'email', 'application'])
      .withMessage('Invalid category'),
    body('roles')
      .isArray()
      .withMessage('Roles must be an array'),
    body('roles.*')
      .isIn(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE', 'VENDOR'])
      .withMessage('Invalid role in array'),
    handleValidationErrors,
  ],
  settingsController.updateRolePermissions
);

module.exports = router;
