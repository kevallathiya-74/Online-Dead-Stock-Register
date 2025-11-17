const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  maintenance_type: { 
    type: String, 
    enum: ['Preventive', 'Corrective', 'Predictive', 'Emergency', 'Inspection', 'Calibration', 'Cleaning'],
    required: true 
  },
  description: { type: String },
  cost: { type: Number, default: 0 },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  maintenance_date: { type: Date, required: true },
  next_maintenance_date: { type: Date },
  performed_by: { type: String },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'], 
    default: 'Scheduled' 
  },
  estimated_duration: { type: Number, default: 2 }, // in hours
  actual_duration: { type: Number },
  downtime_impact: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
