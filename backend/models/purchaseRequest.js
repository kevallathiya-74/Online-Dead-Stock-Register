const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema({
  request_number: {
    type: String,
    unique: true,
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    maxlength: 500
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    estimated_unit_price: {
      type: Number,
      required: true,
      min: 0
    },
    estimated_total: {
      type: Number,
      required: true
    },
    specifications: {
      type: String,
      default: ''
    },
    brand_preference: {
      type: String,
      default: ''
    },
    justification: {
      type: String,
      required: true,
      maxlength: 300
    }
  }],
  total_estimated_cost: {
    type: Number,
    required: true,
    min: 0
  },
  budget_code: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  required_by_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'cancelled',
      'converted_to_po'
    ],
    default: 'draft'
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
    default: ''
  },
  converted_po: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    default: null
  },
  preferred_vendors: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    reason: String
  }],
  attachments: [{
    file_name: String,
    file_path: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  approval_workflow: [{
    step: Number,
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    action_date: Date
  }]
}, {
  timestamps: true
});

// Generate request number before saving
purchaseRequestSchema.pre('save', async function(next) {
  if (!this.request_number || this.request_number.startsWith('PR-TEMP')) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.request_number = `PR-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for better query performance
purchaseRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });
purchaseRequestSchema.index({ department: 1, status: 1 });
purchaseRequestSchema.index({ request_number: 1 });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);