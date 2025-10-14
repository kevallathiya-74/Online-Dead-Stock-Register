const mongoose = require('mongoose');

const assetRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset_type: {
    type: String,
    required: true,
    enum: ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Other']
  },
  asset_category: {
    type: String,
    required: true
  },
  brand_preference: {
    type: String,
    default: null
  },
  specifications: {
    type: String,
    maxlength: 1000
  },
  justification: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expected_usage: {
    type: String,
    maxlength: 300
  },
  budget_range: {
    min: { type: Number, default: null },
    max: { type: Number, default: null }
  },
  required_by_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  review_date: {
    type: Date,
    default: null
  },
  review_comments: {
    type: String,
    maxlength: 500,
    default: null
  },
  assigned_asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    default: null
  },
  fulfilled_date: {
    type: Date,
    default: null
  },
  fulfilled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
assetRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });
assetRequestSchema.index({ status: 1, required_by_date: 1 });

module.exports = mongoose.model('AssetRequest', assetRequestSchema);