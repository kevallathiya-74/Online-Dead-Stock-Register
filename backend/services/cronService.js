const cron = require('node-cron');
const ScheduledAudit = require('../models/scheduledAudit');
const ScheduledAuditRun = require('../models/scheduledAuditRun');
const Asset = require('../models/asset');
const Notification = require('../models/notification');
const AuditLog = require('../models/auditLog');
const { sendAuditReminder, sendAuditOverdueNotification } = require('./emailService');

/**
 * Cron Job Service for Scheduled Audits
 * Automatically triggers audits and sends reminders
 */

// Helper: Calculate next run date
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
      return null;
    default:
      return null;
  }

  return nextDate;
};

// Helper: Build asset query
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

// Check and trigger due audits
const checkAndTriggerAudits = async () => {
  try {
    console.log('🔍 Checking for due scheduled audits...');

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    // Find audits that are due
    const dueAudits = await ScheduledAudit.find({
      status: 'active',
      next_run_date: { $lte: now, $ne: null }
    }).populate('assigned_auditors notification_recipients');

    console.log(`Found ${dueAudits.length} due audit(s)`);

    for (const audit of dueAudits) {
      try {
        // Build asset query
        const assetQuery = buildAssetQuery(audit.scope_type, audit.scope_config);
        const assets = await Asset.find(assetQuery).select('_id');
        const assetIds = assets.map(a => a._id);

        // Create audit run
        const auditRun = new ScheduledAuditRun({
          scheduled_audit_id: audit._id,
          run_date: new Date(),
          status: 'pending',
          assets_to_audit: assetIds,
          total_assets: assetIds.length,
          assigned_auditors: audit.assigned_auditors.map(a => a._id)
        });

        await auditRun.save();

        // Update scheduled audit
        audit.total_runs += 1;
        audit.last_run_date = new Date();
        audit.next_run_date = calculateNextRunDate(
          audit.start_date,
          audit.recurrence_type,
          audit.last_run_date
        );

        // Check if end date has passed
        if (audit.end_date && new Date(audit.end_date) < new Date()) {
          audit.status = 'completed';
        }

        await audit.save();

        // Send notifications
        const notificationRecipients = [
          ...audit.assigned_auditors.map(a => a._id),
          ...audit.notification_recipients
        ];

        if (notificationRecipients.length > 0) {
          await Notification.insertMany(
            notificationRecipients.map(userId => ({
              user_id: userId,
              type: 'audit_scheduled',
              title: `Audit Due: ${audit.name}`,
              message: `Scheduled audit "${audit.name}" is now due with ${assetIds.length} assets to audit.`,
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
          performed_by: 'system',
          details: {
            audit_id: audit._id,
            audit_run_id: auditRun._id,
            audit_name: audit.name,
            assets_count: assetIds.length,
            triggered_by: 'cron'
          },
          timestamp: new Date()
        });

        console.log(`✅ Triggered audit: ${audit.name} (${assetIds.length} assets)`);
      } catch (error) {
        console.error(`❌ Failed to trigger audit ${audit._id}:`, error.message);
        
        // Mark as failed
        audit.failed_runs += 1;
        await audit.save();
      }
    }

    console.log(`✅ Completed audit check - triggered ${dueAudits.length} audit(s)`);
  } catch (error) {
    console.error('❌ Error in checkAndTriggerAudits:', error);
  }
};

// Send reminders for upcoming audits
const sendUpcomingAuditReminders = async () => {
  try {
    console.log('📧 Checking for upcoming audit reminders...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active audits with reminders enabled
    const scheduledAudits = await ScheduledAudit.find({
      status: 'active',
      'reminder_settings.enabled': true,
      next_run_date: { $exists: true, $ne: null }
    }).populate('assigned_auditors notification_recipients');

    let remindersSent = 0;

    for (const audit of scheduledAudits) {
      try {
        const nextRunDate = new Date(audit.next_run_date);
        nextRunDate.setHours(0, 0, 0, 0);
        
        const daysUntilAudit = Math.ceil((nextRunDate - today) / (1000 * 60 * 60 * 24));
        
        // Send reminder if it matches the configured days before
        if (daysUntilAudit === audit.reminder_settings.days_before) {
          // Get asset count
          const assetQuery = buildAssetQuery(audit.scope_type, audit.scope_config);
          const assetsCount = await Asset.countDocuments(assetQuery);

          // Send email reminders
          if (audit.reminder_settings.send_email) {
            const recipients = [
              ...audit.assigned_auditors.map(a => a.email),
              ...audit.notification_recipients.map(r => r.email)
            ].filter(Boolean);

            if (recipients.length > 0) {
              await sendAuditReminder({
                recipients,
                auditName: audit.name,
                auditDate: audit.next_run_date,
                auditType: audit.audit_type,
                assetsCount
              });
              remindersSent++;
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
                message: `Audit scheduled for ${new Date(audit.next_run_date).toLocaleDateString()} - ${assetsCount} assets to audit`,
                related_entity: 'scheduled_audit',
                related_id: audit._id,
                priority: 'medium',
                is_read: false
              }))
            );
          }

          console.log(`✅ Sent reminder for: ${audit.name} (${daysUntilAudit} days until audit)`);
        }
      } catch (error) {
        console.error(`❌ Failed to send reminder for audit ${audit._id}:`, error.message);
      }
    }

    console.log(`✅ Sent ${remindersSent} audit reminder(s)`);
  } catch (error) {
    console.error('❌ Error in sendUpcomingAuditReminders:', error);
  }
};

// Check for overdue audits
const checkOverdueAudits = async () => {
  try {
    console.log('⚠️  Checking for overdue audits...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find audit runs that are overdue (pending/in_progress for > 7 days)
    const overdueRuns = await ScheduledAuditRun.find({
      status: { $in: ['pending', 'in_progress'] },
      run_date: { $lt: sevenDaysAgo }
    }).populate('scheduled_audit_id assigned_auditors');

    for (const run of overdueRuns) {
      try {
        const audit = run.scheduled_audit_id;
        
        // Send overdue notification
        const recipients = [
          ...run.assigned_auditors.map(a => a.email),
          ...(audit.notification_recipients || []).map(r => r.email)
        ].filter(Boolean);

        if (recipients.length > 0) {
          await sendAuditOverdueNotification({
            recipients,
            auditName: audit.name,
            dueDate: run.run_date
          });
        }

        // Send in-app notifications
        await Notification.insertMany(
          run.assigned_auditors.map(auditor => ({
            user_id: auditor._id,
            type: 'audit_overdue',
            title: `⚠️ Overdue Audit: ${audit.name}`,
            message: `Audit run from ${new Date(run.run_date).toLocaleDateString()} is overdue. Please complete as soon as possible.`,
            related_entity: 'audit_run',
            related_id: run._id,
            priority: 'urgent',
            is_read: false
          }))
        );

        console.log(`⚠️  Sent overdue notification for: ${audit.name}`);
      } catch (error) {
        console.error(`❌ Failed to send overdue notification for run ${run._id}:`, error.message);
      }
    }

    console.log(`✅ Checked ${overdueRuns.length} overdue audit run(s)`);
  } catch (error) {
    console.error('❌ Error in checkOverdueAudits:', error);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('🚀 Initializing scheduled audit cron jobs...');

  // Check and trigger due audits every day at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Running daily audit check...');
    await checkAndTriggerAudits();
  }, {
    timezone: process.env.TIMEZONE || 'UTC'
  });

  // Send reminders every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily reminder check...');
    await sendUpcomingAuditReminders();
  }, {
    timezone: process.env.TIMEZONE || 'UTC'
  });

  // Check for overdue audits every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running overdue audit check...');
    await checkOverdueAudits();
  }, {
    timezone: process.env.TIMEZONE || 'UTC'
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   - Audit trigger: Daily at 6:00 AM');
  console.log('   - Reminders: Daily at 8:00 AM');
  console.log('   - Overdue check: Daily at 10:00 AM');
};

module.exports = {
  initializeCronJobs,
  checkAndTriggerAudits,
  sendUpcomingAuditReminders,
  checkOverdueAudits
};
