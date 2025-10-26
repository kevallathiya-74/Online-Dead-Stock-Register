const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom Morgan token for user ID
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

// Custom Morgan token for user role
morgan.token('user-role', (req) => {
  return req.user?.role || 'none';
});

// Custom Morgan format
const morganFormat = ':remote-addr - :user-id [:user-role] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

// Create Morgan middleware with Winston logger stream
const requestLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging health check endpoints
    return req.url === '/health' || req.url === '/api/health';
  }
});

module.exports = requestLogger;
