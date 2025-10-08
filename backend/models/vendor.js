const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendor_name: { type: String, required: true },
  contact_person: { type: String },
  email: { type: String },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
  },
  payment_terms: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', vendorSchema);
