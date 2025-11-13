const mongoose = require('mongoose');

const assetIssueSchema = new mongoose.Schema({
  asset_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Asset ID is required'],
    index: true
  },
  unique_asset_id: {
    type: String,
    required: true,
    index: true
  },
  issue_description: {
    type: String,
    required: [true, 'Issue description is required'],
    maxlength: [2000, 'Issue description cannot exceed 2000 characters']
  },
  issue_type: {
    type: String,
    enum: ['Damage', 'Missing Part', 'Maintenance Required', 'Performance Issue', 'Other'],
    default: 'Other'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  reported_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved_at: {
    type: Date
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution_notes: {
    type: String,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
  },
  scan_location: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploaded_at: Date
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
assetIssueSchema.index({ asset_id: 1, status: 1 });
assetIssueSchema.index({ reported_by: 1, reported_at: -1 });
assetIssueSchema.index({ status: 1, severity: -1 });

// Virtual for issue age in days
assetIssueSchema.virtual('age_in_days').get(function() {
  if (!this.reported_at) return 0;
  const diffTime = Math.abs(new Date() - new Date(this.reported_at));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to mark issue as resolved
assetIssueSchema.methods.markAsResolved = function(userId, resolutionNotes) {
  this.status = 'Resolved';
  this.resolved_at = new Date();
  this.resolved_by = userId;
  if (resolutionNotes) {
    this.resolution_notes = resolutionNotes;
  }
  return this.save();
};

// Static method to get open issues for an asset
assetIssueSchema.statics.getOpenIssuesForAsset = function(assetId) {
  return this.find({
    asset_id: assetId,
    status: { $in: ['Open', 'In Progress'] }
  })
  .populate('reported_by', 'name email')
  .populate('resolved_by', 'name email')
  .sort({ reported_at: -1 });
};

// Static method to get all issues for an asset
assetIssueSchema.statics.getAllIssuesForAsset = function(assetId) {
  return this.find({ asset_id: assetId })
    .populate('reported_by', 'name email')
    .populate('resolved_by', 'name email')
    .sort({ reported_at: -1 });
};

const AssetIssue = mongoose.model('AssetIssue', assetIssueSchema);

module.exports = AssetIssue;
