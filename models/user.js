const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Inventory_Manager', 'Auditor', 'Employee'], required: true },
  department: { type: String, required: true },
  employee_id: { type: String, unique: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
