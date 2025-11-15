const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity_type: { type: String },
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
  old_values: { type: Object },
  new_values: { type: Object },
  changes: { type: Object },
  ip_address: { type: String },
  user_agent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Compound indexes for better query performance
auditLogSchema.index({ timestamp: -1, user_id: 1 }); // Time-based queries with user filter
auditLogSchema.index({ entity_type: 1, entity_id: 1, timestamp: -1 }); // Entity audit trail
auditLogSchema.index({ user_id: 1, action: 1, timestamp: -1 }); // User activity tracking
auditLogSchema.index({ severity: 1, timestamp: -1 }); // Critical events filtering

// TTL index to auto-delete old audit logs after 2 years (optional)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
