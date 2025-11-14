/**
 * Request ID Middleware
 * Generates a unique ID for each request to enable request tracing across logs
 */

const { v4: uuidv4 } = require('crypto').randomUUID ? 
  { v4: () => require('crypto').randomUUID() } : 
  require('uuid');

const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID if provided, otherwise generate new one
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id);
  
  // Add request ID to request object for logging
  req.startTime = Date.now();
  
  next();
};

module.exports = requestIdMiddleware;
