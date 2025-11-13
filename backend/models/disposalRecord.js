const mongoose = require('mongoose');

const disposalRecordSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: [true, 'Asset ID is required'],
    index: true
  },
  asset_name: {
    type: String,
    required: [true, 'Asset name is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  disposal_date: {
    type: Date,
    required: [true, 'Disposal date is required'],
    default: Date.now
  },
  disposal_method: {
    type: String,
    required: [true, 'Disposal method is required'],
    enum: ['Auction', 'Scrap', 'Donation', 'Recycling', 'Sale', 'Other']
  },
  disposal_value: {
    type: Number,
    default: 0,
    min: [0, 'Disposal value cannot be negative']
  },
  approved_by: {
    type: String,
    required: false,
    default: 'SYSTEM'
  },
  document_reference: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'in_progress', 'cancelled'],
    default: 'pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
disposalRecordSchema.index({ disposal_date: -1 });
disposalRecordSchema.index({ status: 1 });
disposalRecordSchema.index({ disposal_method: 1 });
disposalRecordSchema.index({ asset_id: 1, disposal_date: -1 });

// Virtual for formatted disposal date
disposalRecordSchema.virtual('formatted_disposal_date').get(function() {
  return this.disposal_date.toLocaleDateString('en-IN');
});

// Pre-save hook to generate document reference if not provided
disposalRecordSchema.pre('save', function(next) {
  if (!this.document_reference) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    this.document_reference = `DOC-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('DisposalRecord', disposalRecordSchema);
