const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  po_number: {
    type: String,
    unique: true,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    required: true
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
    unit_price: {
      type: Number,
      required: true,
      min: 0
    },
    total_price: {
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
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping_cost: {
    type: Number,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: [
      'draft',
      'pending_approval',
      'approved',
      'sent_to_vendor',
      'acknowledged',
      'in_progress',
      'partially_received',
      'completed',
      'cancelled',
      'rejected'
    ],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expected_delivery_date: {
    type: Date,
    required: true
  },
  actual_delivery_date: {
    type: Date,
    default: null
  },
  delivery_address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String,
    contact_person: String,
    contact_phone: String
  },
  payment_terms: {
    type: String,
    default: 'Net 30'
  },
  payment_method: {
    type: String,
    enum: ['bank_transfer', 'check', 'credit_card', 'cash', 'other'],
    default: 'bank_transfer'
  },
  notes: {
    type: String,
    default: ''
  },
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
  approval_history: [{
    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'cancelled']
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  received_items: [{
    item_index: Number, // Index in the items array
    quantity_received: Number,
    received_date: Date,
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'damaged'],
      default: 'good'
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Generate PO number before saving
purchaseOrderSchema.pre('save', async function(next) {
  if (!this.po_number || this.po_number.startsWith('PO-TEMP')) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.po_number = `PO-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for better query performance
purchaseOrderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ requested_by: 1, status: 1 });
purchaseOrderSchema.index({ po_number: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);