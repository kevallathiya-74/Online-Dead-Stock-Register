const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'], required: true },
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

// ========================================
// OPTIMIZED INDEXES FOR PERFORMANCE
// ========================================

// Unique index on email (already enforced by schema, but explicit for clarity)
userSchema.index({ email: 1 }, { unique: true });

// Unique sparse index on employee_id (only indexes documents with employee_id)
userSchema.index({ employee_id: 1 }, { unique: true, sparse: true });

// Sparse index on vendor_id for vendor users
userSchema.index({ vendor_id: 1 }, { sparse: true });

// Compound index for role-based queries with active status
userSchema.index({ role: 1, is_active: 1 });

// Compound index for department and role filtering
userSchema.index({ department: 1, role: 1 });

// Index for last login tracking (descending order for recent logins)
userSchema.index({ last_login: -1 });

// Index for active users by department
userSchema.index({ is_active: 1, department: 1 });

// Text search index for user search functionality
userSchema.index({ 
  name: 'text', 
  email: 'text',
  employee_id: 'text'
}, {
  name: 'user_text_search',
  weights: {
    email: 10,
    name: 5,
    employee_id: 3
  }
});

module.exports = mongoose.model('User', userSchema);
