const mongoose = require('mongoose');

/**
 * SavedFilter Model
 * Stores user-defined and preset filter configurations for asset queries
 */
const savedFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  filter_config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  is_public: {
    type: Boolean,
    default: false
  },
  is_preset: {
    type: Boolean,
    default: false
  },
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
  usage_count: {
    type: Number,
    default: 0
  },
  last_used_at: {
    type: Date
  },
  category: {
    type: String,
    enum: ['status', 'condition', 'location', 'date', 'user', 'maintenance', 'financial', 'custom'],
    default: 'custom'
  }
});

// Indexes for better query performance
savedFilterSchema.index({ created_by: 1 });
savedFilterSchema.index({ is_public: 1, is_preset: 1 });
savedFilterSchema.index({ category: 1 });

// Update the updated_at timestamp before saving
savedFilterSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('SavedFilter', savedFilterSchema);
