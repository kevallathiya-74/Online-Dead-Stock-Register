const mongoose = require('mongoose');

const assetTransferSchema = new mongoose.Schema({
  transfer_id: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'AT' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
  },
  
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true
  },
  
  // Transfer details
  from_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  to_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  from_location: {
    type: String,
    required: true,
    trim: true
  },
  
  to_location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Transfer request details
  initiated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  transfer_reason: {
    type: String,
    required: true,
    enum: [
      'employee_relocation',
      'department_change',
      'temporary_assignment',
      'permanent_assignment',
      'maintenance_transfer',
      'office_relocation',
      'project_requirement',
      'other'
    ]
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: [
      'pending',           // Initial state - waiting for approval
      'approved',          // Approved by manager/admin
      'rejected',          // Rejected by manager/admin
      'in_transit',        // Asset is being transferred
      'completed',         // Transfer completed successfully
      'cancelled'          // Transfer cancelled
    ],
    default: 'pending',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Approval workflow
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approved_at: {
    type: Date
  },
  
  rejection_reason: {
    type: String,
    trim: true
  },
  
  // Transfer execution
  transferred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Person who physically handled the transfer
  },
  
  transfer_date: {
    type: Date
  },
  
  completion_date: {
    type: Date
  },
  
  // Additional details
  expected_transfer_date: {
    type: Date,
    required: true
  },
  
  actual_transfer_date: {
    type: Date
  },
  
  transfer_conditions: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Handover details
  handover_notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  handover_checklist: [{
    item: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed_at: {
      type: Date
    },
    notes: String
  }],
  
  // Approval history
  approval_history: [{
    action: {
      type: String,
      required: true,
      enum: ['submitted', 'approved', 'rejected', 'cancelled', 'completed', 'in_transit']
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comments: String,
    attachments: [String]  // File paths/URLs
  }],
  
  // Documents
  supporting_documents: [{
    filename: String,
    original_name: String,
    file_path: String,
    file_size: Number,
    mime_type: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tracking information
  tracking_notes: [{
    note: {
      type: String,
      required: true
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    is_internal: {
      type: Boolean,
      default: false  // Whether note is visible to all parties or just admins
    }
  }],
  
  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  last_updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'asset_transfers'
});

// Indexes for better query performance
assetTransferSchema.index({ asset: 1, status: 1 });
assetTransferSchema.index({ from_user: 1, createdAt: -1 });
assetTransferSchema.index({ to_user: 1, createdAt: -1 });
assetTransferSchema.index({ initiated_by: 1, createdAt: -1 });
assetTransferSchema.index({ status: 1, createdAt: -1 });
assetTransferSchema.index({ expected_transfer_date: 1 });
assetTransferSchema.index({ transfer_reason: 1 });

// Virtual for transfer duration
assetTransferSchema.virtual('transfer_duration').get(function() {
  if (this.completion_date && this.createdAt) {
    return Math.ceil((this.completion_date - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
  }
  return null;
});

// Virtual for overdue status
assetTransferSchema.virtual('is_overdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return this.expected_transfer_date < new Date();
});

// Pre-save middleware to update timestamps and validation
assetTransferSchema.pre('save', function(next) {
  // Set approval timestamp
  if (this.status === 'approved' && !this.approved_at) {
    this.approved_at = new Date();
  }
  
  // Set completion timestamp
  if (this.status === 'completed' && !this.completion_date) {
    this.completion_date = new Date();
  }
  
  // Set actual transfer date when status changes to in_transit
  if (this.status === 'in_transit' && !this.actual_transfer_date) {
    this.actual_transfer_date = new Date();
  }
  
  next();
});

// Static methods
assetTransferSchema.statics.getTransferStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

assetTransferSchema.statics.getPendingTransfers = function() {
  return this.find({ 
    status: 'pending',
    expected_transfer_date: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // Next 7 days
  }).populate('asset from_user to_user');
};

assetTransferSchema.statics.getOverdueTransfers = function() {
  return this.find({
    status: { $in: ['pending', 'approved', 'in_transit'] },
    expected_transfer_date: { $lt: new Date() }
  }).populate('asset from_user to_user');
};

// Instance methods
assetTransferSchema.methods.canBeModified = function(userId) {
  // Only creator, from_user, or admin can modify pending transfers
  return this.status === 'pending' && 
         (this.initiated_by.toString() === userId.toString() || 
          this.from_user.toString() === userId.toString());
};

assetTransferSchema.methods.canBeApproved = function(userRole) {
  return this.status === 'pending' && 
         ['ADMIN', 'INVENTORY_MANAGER'].includes(userRole);
};

assetTransferSchema.methods.addTrackingNote = function(note, userId, isInternal = false) {
  this.tracking_notes.push({
    note,
    added_by: userId,
    is_internal: isInternal,
    timestamp: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('AssetTransfer', assetTransferSchema);