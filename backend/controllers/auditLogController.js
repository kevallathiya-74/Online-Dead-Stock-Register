const AuditLog = require('../models/auditLog');
const logger = require('../utils/logger');

/**
 * Get audit logs with filtering, pagination, and search
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page, 
      limit, 
      severity, 
      entityType, 
      action,
      userId,
      search,
      startDate,
      endDate,
      filter // For security audit filter
    } = req.query;

    // If no pagination params, return all logs (backwards compatibility)
    const usePagination = page || limit;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 200;

    // Build query
    let query = {};

    // Filter by severity
    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    // Filter by entity type
    if (entityType && entityType !== 'all') {
      query.entity_type = entityType;
    }

    // Filter by action
    if (action && action !== 'all') {
      query.action = action;
    }

    // Filter by user
    if (userId) {
      query.user_id = userId;
    }

    // Security audit filter - show only security-related events
    if (filter === 'security') {
      query.$or = [
        { severity: { $in: ['warning', 'error', 'critical'] } },
        { action: { $in: ['login', 'logout', 'failed_login', 'password_change', 'permission_change', 'role_change'] } },
        { entity_type: 'User' }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { entity_type: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = usePagination ? (pageNum - 1) * limitNum : 0;

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Get logs with population
    let logsQuery = AuditLog.find(query)
      .populate('user_id', 'name email role')
      .sort({ timestamp: -1 });
    
    if (usePagination) {
      logsQuery = logsQuery.limit(limitNum).skip(skip);
    } else {
      logsQuery = logsQuery.limit(200); // Default limit for backwards compatibility
    }
    
    const logs = await logsQuery.lean();

    logger.info('Audit logs query result', { 
      total, 
      returned: logs.length,
      usePagination,
      query: JSON.stringify(query)
    });

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log._id,
      user_id: log.user_id?._id || log.user_id,
      user_name: log.user_id?.name || 'System',
      user_email: log.user_id?.email,
      user: log.user_id ? {
        id: log.user_id._id,
        name: log.user_id.name,
        email: log.user_id.email,
        role: log.user_id.role
      } : null,
      action: log.action || 'Unknown',
      entity_type: log.entity_type || 'Unknown',
      entity_id: log.entity_id,
      description: log.description || log.action || 'No description',
      timestamp: log.timestamp || new Date(),
      severity: log.severity || 'info',
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || '',
      old_values: log.old_values,
      new_values: log.new_values,
      changes: log.changes
    }));

    // Return different formats based on whether pagination is requested
    if (usePagination) {
      res.json({
        success: true,
        data: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } else {
      // Backwards compatibility - return array directly or in data wrapper
      res.json({
        success: true,
        data: formattedLogs
      });
    }
  } catch (err) {
    logger.error('Error fetching audit logs:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get audit log statistics
 */
exports.getAuditStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalLogs: await AuditLog.countDocuments(),
      todayLogs: await AuditLog.countDocuments({ 
        timestamp: { $gte: today } 
      }),
      criticalEvents: await AuditLog.countDocuments({ 
        severity: 'critical' 
      }),
      securityEvents: await AuditLog.countDocuments({
        $or: [
          { severity: { $in: ['warning', 'error', 'critical'] } },
          { action: { $in: ['login', 'logout', 'failed_login'] } }
        ]
      }),
      byAction: await AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      bySeverity: await AuditLog.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      byEntityType: await AuditLog.aggregate([
        { $group: { _id: '$entity_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    logger.error('Error fetching audit stats:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Export audit logs
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;

    // Build query (reuse logic from getAuditLogs)
    let query = {};
    
    if (filters.severity && filters.severity !== 'all') {
      query.severity = filters.severity;
    }
    if (filters.entityType && filters.entityType !== 'all') {
      query.entity_type = filters.entityType;
    }
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user_id', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    if (format === 'csv') {
      // Proper CSV escaping function
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes by doubling them and wrap in quotes
        if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      // Convert to CSV
      const csvHeaders = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description', 'Severity', 'IP Address'];
      const csvRows = logs.map(log => [
        escapeCsvValue(log.timestamp ? new Date(log.timestamp).toISOString() : ''),
        escapeCsvValue(log.user_id?.name || 'System'),
        escapeCsvValue(log.action),
        escapeCsvValue(log.entity_type),
        escapeCsvValue(log.entity_id || ''),
        escapeCsvValue(log.description || ''),
        escapeCsvValue(log.severity || 'info'),
        escapeCsvValue(log.ip_address || '')
      ]);

      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      const csv = BOM + [
        csvHeaders.map(h => escapeCsvValue(h)).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\r\n'); // Use Windows line endings

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: logs.length,
        data: logs
      });
    }

    logger.info('Audit logs exported', { 
      userId: req.user.id, 
      format, 
      count: logs.length 
    });
  } catch (err) {
    logger.error('Error exporting audit logs:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get current user's activity history
 */
exports.getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    // Find all audit logs for current user
    const logs = await AuditLog.find({ user_id: userId })
      .populate('user_id', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (err) {
    logger.error('Error fetching user activity:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
