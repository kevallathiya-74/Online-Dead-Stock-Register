const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'INVENTORY_MANAGER', 'EMPLOYEE', 'AUDITOR', 'VENDOR'], required: true },
  department: { type: String, enum: ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'], required: true },
  employee_id: { type: String, unique: true, sparse: true },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', sparse: true },
  phone: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
