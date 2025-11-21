const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  vendor_name: { type: String }, // Alias for company_name for backward compatibility
  vendor_code: { type: String, unique: true, sparse: true },
  contact_person: { type: String },
  email: { type: String },
  contact_email: { type: String }, // Alias for email for backward compatibility
  phone: { type: String },
  profile_photo: { type: String }, // URL or base64 encoded image
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
  },
  payment_terms: { type: String },
  vendor_type: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  performance_rating: { type: Number, default: 0, min: 0, max: 5 }, // Alias for rating
  is_active: { type: Boolean, default: true },
  category: [{ type: String }],
  categories: [{ type: String }], // Alias for category
  gst_number: { type: String },
  pan_number: { type: String },
  bank_details: {
    bank_name: String,
    account_number: String,
    ifsc_code: String
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Virtual for backward compatibility
vendorSchema.virtual('name').get(function() {
  return this.company_name || this.vendor_name;
});

vendorSchema.virtual('displayName').get(function() {
  return this.company_name || this.vendor_name;
});

// Ensure virtuals are included in JSON output
vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

// Indexes
vendorSchema.index({ vendor_name: 'text', contact_person: 'text', vendor_code: 'text' });
vendorSchema.index({ is_active: 1, performance_rating: -1 });
vendorSchema.index({ vendor_code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Vendor', vendorSchema);
