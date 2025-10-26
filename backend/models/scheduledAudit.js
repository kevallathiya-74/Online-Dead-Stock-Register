const mongoose = require('mongoose');

const scheduledAuditSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Schedule configuration
  recurrence_type: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  cron_expression: String, // For custom cron schedules
  
  // Time settings
  start_date: {
    type: Date,
    required: true
  },
  end_date: Date, // Optional - for finite schedules
  next_run_date: Date,
  last_run_date: Date,
  
  // Audit configuration
  audit_type: {
    type: String,
    enum: ['full', 'partial', 'spot_check', 'condition', 'location'],
    default: 'full'
  },
  
  // Asset scope
  scope_type: {
    type: String,
    enum: ['all', 'department', 'location', 'category', 'custom_filter'],
    required: true
  },
  scope_config: {
    type: mongoose.Schema.Types.Mixed // Stores filter criteria
  },
  
  // Assignments
  assigned_auditors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  auto_assign: {
    type: Boolean,
    default: false
  },
  
  // Reminders
  reminder_settings: {
    enabled: {
      type: Boolean,
      default: true
    },
    days_before: {
      type: Number,
      default: 1
    },
    send_email: {
      type: Boolean,
      default: true
    },
    send_notification: {
      type: Boolean,
      default: true
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Completion tracking
  total_runs: {
    type: Number,
    default: 0
  },
  completed_runs: {
    type: Number,
    default: 0
  },
  failed_runs: {
    type: Number,
    default: 0
  },
  
  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // Checklist template
  checklist_items: [{
    item: String,
    is_required: Boolean,
    order: Number
  }],
  
  // Notification recipients
  notification_recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Index for querying active schedules
scheduledAuditSchema.index({ status: 1, next_run_date: 1 });
scheduledAuditSchema.index({ created_by: 1 });

module.exports = mongoose.model('ScheduledAudit', scheduledAuditSchema);
