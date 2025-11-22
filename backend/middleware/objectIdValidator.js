const mongoose = require('mongoose');

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId parameters
 * Usage: router.get('/users/:id', validateObjectId('id'), getUserById)
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: `Missing required parameter: ${paramName}`
      });
    }
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId.`
      });
    }
    
    next();
  };
};

/**
 * Validate multiple ObjectId parameters
 * Usage: router.get('/assets/:assetId/transfers/:transferId', validateObjectIds(['assetId', 'transferId']), handler)
 * @param {string[]} paramNames - Array of parameter names to validate
 * @returns {Function} Express middleware function
 */
const validateObjectIds = (paramNames = []) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: `Missing required parameter: ${paramName}`
        });
      }
      
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId.`
        });
      }
    }
    
    next();
  };
};

/**
 * Validate ObjectId in request body
 * @param {string} fieldName - The field name in request body to validate
 * @param {boolean} required - Whether the field is required (default: true)
 * @returns {Function} Express middleware function
 */
const validateBodyObjectId = (fieldName, required = true) => {
  return (req, res, next) => {
    const id = req.body[fieldName];
    
    if (!id) {
      if (required) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${fieldName}`
        });
      }
      // Field is optional and not provided, skip validation
      return next();
    }
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${fieldName} format. Must be a valid MongoDB ObjectId.`
      });
    }
    
    next();
  };
};

module.exports = {
  isValidObjectId,
  validateObjectId,
  validateObjectIds,
  validateBodyObjectId
};
