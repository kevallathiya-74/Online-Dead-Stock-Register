const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    unique: true,
    required: true
  },
  purchase_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  invoice_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  due_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: [
      'draft',
      'sent',
      'received',
      'approved',
      'paid',
      'overdue',
      'cancelled'
    ],
    default: 'draft'
  },
  items: [{
    description: {
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
    tax_rate: {
      type: Number,
      default: 0.18, // 18% GST
      min: 0,
      max: 1
    },
    total_amount: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax_amount: {
    type: Number,
    required: true,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  payment_method: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash', 'upi', 'credit_card', 'other'],
    default: 'bank_transfer'
  },
  payment_date: {
    type: Date,
    default: null
  },
  payment_reference: {
    type: String,
    default: ''
  },
  vendor_gstin: {
    type: String,
    default: ''
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoice_number || this.invoice_number.startsWith('INV-TEMP')) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.invoice_number = `INV-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for better query performance
invoiceSchema.index({ vendor: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ purchase_order: 1 });
invoiceSchema.index({ invoice_number: 1 });
invoiceSchema.index({ invoice_date: 1, due_date: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
