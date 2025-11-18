const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendor_name: { type: String, required: true },
  name: { type: String }, // Alias for vendor_name for compatibility
  vendor_code: { type: String, unique: true, sparse: true },
  contact_person: { type: String },
  contact_email: { type: String },
  email: { type: String }, // Alias for contact_email
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
  },
  payment_terms: { type: String },
  vendor_type: { type: String },
  performance_rating: { type: Number, default: 0, min: 0, max: 5 },
  is_active: { type: Boolean, default: true },
  categories: [{ type: String }],
  gst_number: { type: String },
  pan_number: { type: String },
  bank_details: {
    bank_name: String,
    account_number: String,
    ifsc_code: String
  },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Virtual for name to support both vendor_name and name
vendorSchema.virtual('displayName').get(function() {
  return this.vendor_name || this.name;
});

// Indexes
vendorSchema.index({ vendor_name: 'text', contact_person: 'text', vendor_code: 'text' });
vendorSchema.index({ is_active: 1, performance_rating: -1 });
vendorSchema.index({ vendor_code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Vendor', vendorSchema);
