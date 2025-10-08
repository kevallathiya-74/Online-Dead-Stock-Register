const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  maintenance_type: { type: String, required: true },
  description: { type: String },
  cost: { type: Number },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  maintenance_date: { type: Date, required: true },
  next_maintenance_date: { type: Date },
  performed_by: { type: String },
  status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
