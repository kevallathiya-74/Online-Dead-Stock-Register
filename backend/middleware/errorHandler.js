const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error with details
  logger.error('Error occurred', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
    statusCode: error.statusCode
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new AppError('Validation failed', 400, true, messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = new AppError(message, 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoServerSelectionError') {
    const message = 'Database connection error';
    error = new AppError(message, 503);
  }

  if (err.name === 'MongoNetworkError') {
    const message = 'Database network error';
    error = new AppError(message, 503);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File size exceeds the allowed limit', 400);
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError('Too many files uploaded', 400);
    } else {
      error = new AppError(`File upload error: ${err.message}`, 400);
    }
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = new AppError('CORS policy violation', 403);
  }

  // Send error response
  const response = {
    success: false,
    error: error.message || 'Internal server error',
    statusCode: error.statusCode
  };

  // Include errors array for validation errors
  if (error.errors) {
    response.errors = error.errors;
  }

  // Include retry-after for rate limit errors
  if (error.retryAfter) {
    response.retryAfter = error.retryAfter;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;