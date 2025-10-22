const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoServerSelectionError') {
    const message = 'Database connection error';
    error = new ErrorResponse(message, 503);
  }

  if (err.name === 'MongoNetworkError') {
    const message = 'Database network error';
    error = new ErrorResponse(message, 503);
  }

  // Don't expose error details in production
  const response = {
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? error.message || 'Server Error'
      : 'Something went wrong'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;