/**
 * CENTRALIZED ERROR RESPONSE UTILITY
 * ✅ ONE FILE CONTROLS THE ENTIRE ERROR RESPONSE SYSTEM
 * ✅ NO DUPLICATE ERROR HANDLING ALLOWED
 * ✅ ALL CONTROLLERS MUST USE THIS
 */

const logger = require('./logger');

/**
 * Standard API Response Format
 */
class ApiResponse {
  /**
   * Success Response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data
    };

    // Remove null data field if no data
    if (data === null || data === undefined) {
      delete response.data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error Response (User-Friendly, Never Expose Internal Details)
   * @param {Object} res - Express response object
   * @param {String} message - User-friendly error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {Array} errors - Validation errors array (optional)
   */
  static error(res, message = 'Internal server error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      error: message,
      statusCode
    };

    // Add validation errors if provided
    if (errors && Array.isArray(errors) && errors.length > 0) {
      response.errors = errors;
    }

    // Add retry-after for rate limiting (if available on res object)
    if (res.retryAfter) {
      response.retryAfter = res.retryAfter;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Created Response (for POST requests)
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * No Content Response (for DELETE requests)
   * @param {Object} res - Express response object
   * @param {String} message - Success message
   */
  static deleted(res, message = 'Resource deleted successfully') {
    return res.status(200).json({
      success: true,
      message
    });
  }

  /**
   * Bad Request Response (400)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Array} errors - Validation errors
   */
  static badRequest(res, message = 'Invalid request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  /**
   * Unauthorized Response (401)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Authentication required') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Forbidden Response (403)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Access forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Not Found Response (404)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  /**
   * Conflict Response (409)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

  /**
   * Rate Limit Response (429)
   * @param {Object} res - Express response object
   * @param {Number} retryAfter - Seconds until retry allowed
   */
  static tooManyRequests(res, retryAfter = 60) {
    res.retryAfter = retryAfter;
    return ApiResponse.error(
      res,
      `Too many requests. Please try again after ${retryAfter} seconds`,
      429
    );
  }

  /**
   * Service Unavailable Response (503)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static serviceUnavailable(res, message = 'Service temporarily unavailable') {
    return ApiResponse.error(res, message, 503);
  }
}

/**
 * Async Handler Wrapper
 * ✅ ELIMINATES TRY-CATCH DUPLICATION IN CONTROLLERS
 * ✅ AUTOMATICALLY CATCHES ERRORS AND PASSES TO ERROR HANDLER MIDDLEWARE
 * 
 * @param {Function} fn - Async controller function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error(`Controller Error: ${error.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id,
      stack: error.stack
    });
    next(error);
  });
};

/**
 * Custom Application Error Class
 * Used to throw errors with specific status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  ApiResponse,
  asyncHandler,
  AppError
};
