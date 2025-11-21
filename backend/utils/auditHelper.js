const AuditLog = require('../models/auditLog');
const logger = require('./logger');

/**
 * Extract client IP address from request
 * Handles various proxy configurations and fallbacks
 */
const getClientIp = (req) => {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header (some proxies use this)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // Check for cloudflare connecting IP
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  // Fallback to connection remote address
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  // Express provides req.ip
  if (req.ip) {
    return req.ip;
  }

  // Socket remote address
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  // Default if nothing found
  return 'Unknown';
};

/**
 * Get user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

/**
 * Create audit log with proper IP and user agent extraction
 * @param {Object} data - Audit log data
 * @param {Object} req - Express request object (optional)
 */
const createAuditLog = async (data, req = null) => {
  try {
    const auditData = {
      ...data,
      timestamp: data.timestamp || new Date()
    };

    // Add IP and user agent if request object provided
    if (req) {
      auditData.ip_address = data.ip_address || getClientIp(req);
      auditData.user_agent = data.user_agent || getUserAgent(req);
    } else {
      // Ensure we have default values even without request
      auditData.ip_address = data.ip_address || 'System';
      auditData.user_agent = data.user_agent || 'System Process';
    }

    // Ensure severity is set
    auditData.severity = data.severity || 'info';

    // Create the audit log
    const auditLog = await AuditLog.create(auditData);
    
    return auditLog;
  } catch (error) {
    logger.error('Error creating audit log:', error);
    // Don't throw error - audit log creation shouldn't break main operations
    return null;
  }
};

/**
 * Create multiple audit logs in batch
 * @param {Array} logs - Array of audit log data objects
 * @param {Object} req - Express request object (optional)
 */
const createAuditLogs = async (logs, req = null) => {
  try {
    const auditLogs = logs.map(log => ({
      ...log,
      ip_address: log.ip_address || (req ? getClientIp(req) : 'System'),
      user_agent: log.user_agent || (req ? getUserAgent(req) : 'System Process'),
      severity: log.severity || 'info',
      timestamp: log.timestamp || new Date()
    }));

    const result = await AuditLog.create(auditLogs);
    return result;
  } catch (error) {
    logger.error('Error creating batch audit logs:', error);
    return null;
  }
};

/**
 * Create audit log for user action
 */
const logUserAction = async (req, action, entityType, entityId, description, severity = 'info') => {
  return createAuditLog({
    user_id: req.user?.id || req.user?._id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
    severity
  }, req);
};

/**
 * Create audit log for system action (no user)
 */
const logSystemAction = async (action, entityType, entityId, description, severity = 'info') => {
  return createAuditLog({
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
    severity,
    ip_address: 'System',
    user_agent: 'Automated Process'
  });
};

module.exports = {
  getClientIp,
  getUserAgent,
  createAuditLog,
  createAuditLogs,
  logUserAction,
  logSystemAction
};
