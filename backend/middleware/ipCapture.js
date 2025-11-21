const logger = require('../utils/logger');

/**
 * Middleware to capture and normalize client IP address
 * Adds standardized IP to req.clientIp
 */
const captureClientIp = (req, res, next) => {
  try {
    // Check for forwarded IP (behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      req.clientIp = forwarded.split(',')[0].trim();
      return next();
    }

    // Check for real IP header
    if (req.headers['x-real-ip']) {
      req.clientIp = req.headers['x-real-ip'];
      return next();
    }

    // Check for cloudflare connecting IP
    if (req.headers['cf-connecting-ip']) {
      req.clientIp = req.headers['cf-connecting-ip'];
      return next();
    }

    // Connection remote address
    if (req.connection && req.connection.remoteAddress) {
      req.clientIp = req.connection.remoteAddress;
      return next();
    }

    // Express req.ip
    if (req.ip) {
      req.clientIp = req.ip;
      return next();
    }

    // Socket remote address
    if (req.socket && req.socket.remoteAddress) {
      req.clientIp = req.socket.remoteAddress;
      return next();
    }

    // Fallback
    req.clientIp = 'Unknown';
    next();
  } catch (error) {
    logger.error('Error capturing client IP:', error);
    req.clientIp = 'Unknown';
    next();
  }
};

module.exports = captureClientIp;
