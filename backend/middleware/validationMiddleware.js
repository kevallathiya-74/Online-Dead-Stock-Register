const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
  
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isIn(['INVENTORY', 'IT', 'ADMIN', 'VENDOR'])
    .withMessage('Invalid department. Must be one of: INVENTORY, IT, ADMIN, VENDOR'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR', 'VENDOR'])
    .withMessage('Invalid role'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Invalid password format'),
  
  handleValidationErrors
];

/**
 * Validation rules for forgot password
 */
const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * Validation rules for password reset
 */
const validateResetPassword = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token format')
    .matches(/^[a-f0-9]+$/)
    .withMessage('Invalid token format'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

/**
 * Validation rules for asset creation
 */
const validateAssetCreation = [
  body('unique_asset_id')
    .trim()
    .notEmpty()
    .withMessage('Asset ID is required')
    .isLength({ max: 50 })
    .withMessage('Asset ID must not exceed 50 characters'),
  
  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer is required')
    .isLength({ max: 100 })
    .withMessage('Manufacturer name must not exceed 100 characters'),
  
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ max: 100 })
    .withMessage('Model must not exceed 100 characters'),
  
  body('serial_number')
    .trim()
    .notEmpty()
    .withMessage('Serial number is required')
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),
  
  body('asset_type')
    .trim()
    .notEmpty()
    .withMessage('Asset type is required')
    .isLength({ max: 50 })
    .withMessage('Asset type must not exceed 50 characters'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isIn(['INVENTORY', 'IT', 'ADMIN'])
    .withMessage('Invalid department'),
  
  body('purchase_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase cost must be a positive number'),
  
  handleValidationErrors
];

/**
 * Validation for query parameters (pagination, search, etc.)
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .customSanitizer(value => {
      // Escape regex special characters to prevent ReDoS
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

/**
 * Sanitize search query to prevent ReDoS attacks
 */
const sanitizeSearchQuery = (search) => {
  if (!search || typeof search !== 'string') return '';
  // Escape regex special characters
  return search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .matches(/^[a-f\d]{24}$/i)
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateAssetCreation,
  validateQueryParams,
  validateObjectId,
  sanitizeSearchQuery
};
