const mongoose = require('mongoose');

const scheduledAuditRunSchema = new mongoose.Schema({
  scheduled_audit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledAudit',
    required: true
  },
  
  // Run details
  run_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Asset scope for this run
  assets_to_audit: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  total_assets: {
    type: Number,
    default: 0
  },
  
  // Progress tracking
  audited_assets: [{
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
    audited_at: Date,
    audited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['found', 'not_found', 'damaged', 'missing']
    },
    condition: String,
    location: String,
    notes: String,
    checklist_responses: [{
      item: String,
      response: mongoose.Schema.Types.Mixed,
      completed: Boolean
    }]
  }],
  
  // Completion statistics
  assets_found: {
    type: Number,
    default: 0
  },
  assets_not_found: {
    type: Number,
    default: 0
  },
  assets_damaged: {
    type: Number,
    default: 0
  },
  assets_missing: {
    type: Number,
    default: 0
  },
  completion_percentage: {
    type: Number,
    default: 0
  },
  
  // Timing
  started_at: Date,
  completed_at: Date,
  
  // Assigned auditors for this run
  assigned_auditors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Reminders sent
  reminders_sent: [{
    sent_at: Date,
    type: String, // 'email' or 'notification'
    recipients: [String]
  }],
  
  // Notes and observations
  summary_notes: String,
  issues_found: [{
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
    issue_type: String,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reported_at: Date
  }],
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Index for querying runs
scheduledAuditRunSchema.index({ scheduled_audit_id: 1, run_date: -1 });
scheduledAuditRunSchema.index({ status: 1, run_date: 1 });

module.exports = mongoose.model('ScheduledAuditRun', scheduledAuditRunSchema);
