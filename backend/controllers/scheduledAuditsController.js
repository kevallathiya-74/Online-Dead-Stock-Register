const ScheduledAudit = require('../models/scheduledAudit');
const logger = require('../utils/logger');
const ScheduledAuditRun = require('../models/scheduledAuditRun');
const Asset = require('../models/asset');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');
const { sendAuditReminder, sendAuditCompletionNotification, sendAuditOverdueNotification } = require('../services/emailService');

/**
 * Scheduled Audits Controller
 * Handles creation, scheduling, and management of recurring audits
 */

// Helper: Calculate next run date based on recurrence
const calculateNextRunDate = (startDate, recurrenceType, lastRunDate = null) => {
  const baseDate = lastRunDate ? new Date(lastRunDate) : new Date(startDate);
  const nextDate = new Date(baseDate);

  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'once':
      return null; // No next run for one-time audits
    default:
      return null;
  }

  return nextDate;
};

// Helper: Build asset query based on scope configuration
const buildAssetQuery = (scopeType, scopeConfig) => {
  let query = {};

  switch (scopeType) {
    case 'all':
      query = { status: { $ne: 'Disposed' } };
      break;
    case 'department':
      query = { 
        department: scopeConfig.department,
        status: { $ne: 'Disposed' }
      };
      break;
    case 'location':
      query = { 
        location: scopeConfig.location,
        status: { $ne: 'Disposed' }
      };
      break;
    case 'category':
      query = { 
        category: scopeConfig.category,
        status: { $ne: 'Disposed' }
      };
      break;
    case 'custom_filter':
      query = { ...scopeConfig, status: { $ne: 'Disposed' } };
      break;
    default:
      query = { status: { $ne: 'Disposed' } };
  }

  return query;
};

// Create scheduled audit
exports.createScheduledAudit = async (req, res) => {
  try {
    const {
      name,
      description,
      recurrence_type,
      start_date,
      end_date,
      audit_type,
      scope_type,
      scope_config,
      assigned_auditors,
      auto_assign,
      reminder_settings,
      checklist_items,
      notification_recipients
    } = req.body;

    if (!name || !recurrence_type || !start_date || !scope_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, recurrence type, start date, and scope type are required'
      });
    }

    // Calculate next run date
    const next_run_date = calculateNextRunDate(start_date, recurrence_type);

    const scheduledAudit = new ScheduledAudit({
      name,
      description,
      recurrence_type,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      next_run_date,
      audit_type: audit_type || 'full',
      scope_type,
      scope_config: scope_config || {},
      assigned_auditors: assigned_auditors || [],
      auto_assign: auto_assign || false,
      reminder_settings: {
        enabled: reminder_settings?.enabled !== false,
        days_before: reminder_settings?.days_before || 1,
        send_email: reminder_settings?.send_email !== false,
        send_notification: reminder_settings?.send_notification !== false
      },
      checklist_items: checklist_items || [],
      notification_recipients: notification_recipients || [],
      created_by: req.user.id,
      status: 'active'
    });

    await scheduledAudit.save();

    // Log creation
    await AuditLog.create({
      action: 'scheduled_audit_created',
      performed_by: req.user.id,
      details: {
        audit_id: scheduledAudit._id,
        audit_name: name,
        recurrence_type,
        next_run_date
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Scheduled audit created successfully',
      scheduled_audit: {
        id: scheduledAudit._id,
        name: scheduledAudit.name,
        recurrence_type: scheduledAudit.recurrence_type,
        next_run_date: scheduledAudit.next_run_date,
        status: scheduledAudit.status
      }
    });
  } catch (error) {
    logger.error('Error creating scheduled audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled audit',
      error: error.message
    });
  }
};

// Get all scheduled audits
exports.getScheduledAudits = async (req, res) => {
  try {
    const { status, recurrence_type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by recurrence type
    if (recurrence_type) {
      query.recurrence_type = recurrence_type;
    }

    // Non-admin users only see their created audits
    if (req.user.role !== 'ADMIN') {
      query.$or = [
        { created_by: req.user.id },
        { assigned_auditors: req.user.id }
      ];
    }

    const total = await ScheduledAudit.countDocuments(query);

    const scheduledAudits = await ScheduledAudit.find(query)
      .populate('created_by', 'name email')
      .populate('assigned_auditors', 'name email')
      .populate('notification_recipients', 'name email')
      .sort({ next_run_date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      scheduled_audits: scheduledAudits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching scheduled audits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled audits',
      error: error.message
    });
  }
};

// Get scheduled audit by ID
exports.getScheduledAuditById = async (req, res) => {
  try {
    const { audit_id } = req.params;

    const scheduledAudit = await ScheduledAudit.findById(audit_id)
      .populate('created_by', 'name email')
      .populate('assigned_auditors', 'name email department')
      .populate('notification_recipients', 'name email');

    if (!scheduledAudit) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled audit not found'
      });
    }

    // Check access
    if (req.user.role !== 'ADMIN' && 
        scheduledAudit.created_by._id.toString() !== req.user.id &&
        !scheduledAudit.assigned_auditors.some(a => a._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get run history
    const runs = await ScheduledAuditRun.find({ scheduled_audit_id: audit_id })
      .populate('assigned_auditors', 'name email')
      .sort({ run_date: -1 })
      .limit(10);

    res.json({
      success: true,
      scheduled_audit: scheduledAudit,
      recent_runs: runs
    });
  } catch (error) {
    logger.error('Error fetching scheduled audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled audit',
      error: error.message
    });
  }
};

// Update scheduled audit
exports.updateScheduledAudit = async (req, res) => {
  try {
    const { audit_id } = req.params;
    const updates = req.body;

    const scheduledAudit = await ScheduledAudit.findById(audit_id);

    if (!scheduledAudit) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled audit not found'
      });
    }

    // Check permission
    if (req.user.role !== 'ADMIN' && scheduledAudit.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator or admin can update this audit'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'recurrence_type', 'start_date', 'end_date',
      'audit_type', 'scope_type', 'scope_config', 'assigned_auditors',
      'reminder_settings', 'checklist_items', 'notification_recipients', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        scheduledAudit[field] = updates[field];
      }
    });

    // Recalculate next run date if recurrence changed
    if (updates.recurrence_type || updates.start_date) {
      scheduledAudit.next_run_date = calculateNextRunDate(
        scheduledAudit.start_date,
        scheduledAudit.recurrence_type,
        scheduledAudit.last_run_date
      );
    }

    scheduledAudit.updated_at = new Date();
    await scheduledAudit.save();

    // Log update
    await AuditLog.create({
      action: 'scheduled_audit_updated',
      performed_by: req.user.id,
      details: {
        audit_id,
        audit_name: scheduledAudit.name,
        updates: Object.keys(updates)
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Scheduled audit updated successfully',
      scheduled_audit: scheduledAudit
    });
  } catch (error) {
    logger.error('Error updating scheduled audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled audit',
      error: error.message
    });
  }
};

// Delete scheduled audit
exports.deleteScheduledAudit = async (req, res) => {
  try {
    const { audit_id } = req.params;

    const scheduledAudit = await ScheduledAudit.findById(audit_id);

    if (!scheduledAudit) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled audit not found'
      });
    }

    // Check permission
    if (req.user.role !== 'ADMIN' && scheduledAudit.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator or admin can delete this audit'
      });
    }

    await ScheduledAudit.findByIdAndDelete(audit_id);

    // Log deletion
    await AuditLog.create({
      action: 'scheduled_audit_deleted',
      performed_by: req.user.id,
      details: {
        audit_id,
        audit_name: scheduledAudit.name
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Scheduled audit deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting scheduled audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled audit',
      error: error.message
    });
  }
};

// Trigger audit run (manually or by cron job)
exports.triggerAuditRun = async (req, res) => {
  try {
    const { audit_id } = req.params;

    const scheduledAudit = await ScheduledAudit.findById(audit_id)
      .populate('assigned_auditors', 'name email');

    if (!scheduledAudit) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled audit not found'
      });
    }

    if (scheduledAudit.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot trigger audit - audit is not active'
      });
    }

    // Build asset query
    const assetQuery = buildAssetQuery(scheduledAudit.scope_type, scheduledAudit.scope_config);
    const assets = await Asset.find(assetQuery).select('_id');
    const assetIds = assets.map(a => a._id);

    // Create audit run
    const auditRun = new ScheduledAuditRun({
      scheduled_audit_id: audit_id,
      run_date: new Date(),
      status: 'pending',
      assets_to_audit: assetIds,
      total_assets: assetIds.length,
      assigned_auditors: scheduledAudit.assigned_auditors.map(a => a._id)
    });

    await auditRun.save();

    // Update scheduled audit
    scheduledAudit.total_runs += 1;
    scheduledAudit.last_run_date = new Date();
    scheduledAudit.next_run_date = calculateNextRunDate(
      scheduledAudit.start_date,
      scheduledAudit.recurrence_type,
      scheduledAudit.last_run_date
    );
    await scheduledAudit.save();

    // Send notifications
    const notificationRecipients = [
      ...scheduledAudit.assigned_auditors.map(a => a._id),
      ...scheduledAudit.notification_recipients
    ];

    if (notificationRecipients.length > 0) {
      await Notification.insertMany(
        notificationRecipients.map(userId => ({
          user_id: userId,
          type: 'audit_scheduled',
          title: `Audit Run Started: ${scheduledAudit.name}`,
          message: `A new audit run has been triggered with ${assetIds.length} assets to audit.`,
          related_entity: 'audit_run',
          related_id: auditRun._id,
          priority: 'high',
          is_read: false
        }))
      );
    }

    // Log trigger
    await AuditLog.create({
      action: 'audit_run_triggered',
      performed_by: req.user?.id || 'system',
      details: {
        audit_id,
        audit_run_id: auditRun._id,
        audit_name: scheduledAudit.name,
        assets_count: assetIds.length
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Audit run triggered successfully',
      audit_run: {
        id: auditRun._id,
        status: auditRun.status,
        total_assets: auditRun.total_assets,
        run_date: auditRun.run_date
      }
    });
  } catch (error) {
    logger.error('Error triggering audit run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger audit run',
      error: error.message
    });
  }
};

// Get audit runs
exports.getAuditRuns = async (req, res) => {
  try {
    const { audit_id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { scheduled_audit_id: audit_id };

    if (status) {
      query.status = status;
    }

    const total = await ScheduledAuditRun.countDocuments(query);

    const runs = await ScheduledAuditRun.find(query)
      .populate('assigned_auditors', 'name email')
      .populate('scheduled_audit_id', 'name audit_type')
      .sort({ run_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      audit_runs: runs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching audit runs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit runs',
      error: error.message
    });
  }
};

// Update audit run progress
exports.updateAuditRunProgress = async (req, res) => {
  try {
    const { run_id } = req.params;
    const { asset_id, status, condition, location, notes, checklist_responses } = req.body;

    const auditRun = await ScheduledAuditRun.findById(run_id);

    if (!auditRun) {
      return res.status(404).json({
        success: false,
        message: 'Audit run not found'
      });
    }

    // Check if auditor is assigned
    if (!auditRun.assigned_auditors.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this audit run'
      });
    }

    // Add audited asset
    auditRun.audited_assets.push({
      asset_id,
      audited_at: new Date(),
      audited_by: req.user.id,
      status,
      condition,
      location,
      notes,
      checklist_responses
    });

    // Update statistics
    if (status === 'found') auditRun.assets_found += 1;
    if (status === 'not_found') auditRun.assets_not_found += 1;
    if (status === 'damaged') auditRun.assets_damaged += 1;
    if (status === 'missing') auditRun.assets_missing += 1;

    auditRun.completion_percentage = (auditRun.audited_assets.length / auditRun.total_assets) * 100;

    // Check if audit is complete
    if (auditRun.audited_assets.length >= auditRun.total_assets) {
      auditRun.status = 'completed';
      auditRun.completed_at = new Date();
    } else if (auditRun.status === 'pending') {
      auditRun.status = 'in_progress';
      auditRun.started_at = new Date();
    }

    auditRun.updated_at = new Date();
    await auditRun.save();

    // Update asset record
    await Asset.findByIdAndUpdate(asset_id, {
      last_audit_date: new Date(),
      last_audited_by: req.user.id,
      condition: condition || undefined
    });

    // Log audit
    await AuditLog.create({
      action: 'asset_audited',
      asset: asset_id,
      performed_by: req.user.id,
      details: {
        audit_run_id: run_id,
        status,
        condition,
        location
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Audit progress updated',
      completion_percentage: auditRun.completion_percentage,
      is_complete: auditRun.status === 'completed'
    });
  } catch (error) {
    logger.error('Error updating audit progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update audit progress',
      error: error.message
    });
  }
};

// Send reminders for upcoming audits
exports.sendAuditReminders = async (req, res) => {
  try {
    const reminderDate = new Date();
    reminderDate.setHours(0, 0, 0, 0);
    
    // Find audits scheduled within reminder window
    const scheduledAudits = await ScheduledAudit.find({
      status: 'active',
      'reminder_settings.enabled': true,
      next_run_date: { $exists: true, $ne: null }
    }).populate('assigned_auditors notification_recipients');

    let remindersSent = 0;

    for (const audit of scheduledAudits) {
      const daysUntilAudit = Math.ceil((new Date(audit.next_run_date) - reminderDate) / (1000 * 60 * 60 * 24));
      
      if (daysUntilAudit === audit.reminder_settings.days_before) {
        const recipients = [
          ...audit.assigned_auditors.map(a => a.email),
          ...audit.notification_recipients.map(r => r.email)
        ].filter(Boolean);

        if (recipients.length > 0 && audit.reminder_settings.send_email) {
          try {
            await sendAuditReminder({
              recipients,
              auditName: audit.name,
              auditDate: audit.next_run_date,
              auditType: audit.audit_type,
              assetsCount: 'TBD' // Will be calculated at run time
            });
            remindersSent++;
          } catch (error) {
            logger.error(`Failed to send reminder for audit ${audit._id}:`, error);
          }
        }

        // Send in-app notifications
        if (audit.reminder_settings.send_notification) {
          const notificationUsers = [
            ...audit.assigned_auditors.map(a => a._id),
            ...audit.notification_recipients
          ];

          await Notification.insertMany(
            notificationUsers.map(userId => ({
              user_id: userId,
              type: 'audit_reminder',
              title: `Upcoming Audit: ${audit.name}`,
              message: `Audit scheduled for ${new Date(audit.next_run_date).toLocaleDateString()}`,
              related_entity: 'scheduled_audit',
              related_id: audit._id,
              priority: 'medium'
            }))
          );
        }
      }
    }

    res.json({
      success: true,
      message: `Sent ${remindersSent} audit reminders`,
      reminders_sent: remindersSent
    });
  } catch (error) {
    logger.error('Error sending audit reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send audit reminders',
      error: error.message
    });
  }
};

module.exports = exports;
