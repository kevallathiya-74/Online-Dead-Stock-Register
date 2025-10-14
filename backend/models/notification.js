const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // System notifications won't have a sender
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: [
      'info',
      'warning', 
      'error',
      'success',
      'maintenance',
      'audit',
      'approval',
      'asset_assigned',
      'asset_returned',
      'warranty_expiring',
      'system'
    ],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Additional data for the notification
    default: null
  },
  action_url: {
    type: String, // URL to navigate when notification is clicked
    default: null
  },
  expires_at: {
    type: Date,
    default: null // For temporary notifications
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ recipient: 1, is_read: 1, createdAt: -1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

module.exports = mongoose.model('Notification', notificationSchema);