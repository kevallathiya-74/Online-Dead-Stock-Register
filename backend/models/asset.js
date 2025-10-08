const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  unique_asset_id: { type: String, required: true, unique: true },
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  serial_number: { type: String, required: true },
  asset_type: { type: String, required: true },
  location: { type: String, required: true },
  assigned_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Under Maintenance', 'Available', 'Damaged', 'Ready for Scrap'], default: 'Available' },
  purchase_date: { type: Date },
  purchase_cost: { type: Number },
  warranty_expiry: { type: Date },
  last_audit_date: { type: Date },
  condition: { type: String },
  configuration: { type: Object },
  expected_lifespan: { type: Number },
},{
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);