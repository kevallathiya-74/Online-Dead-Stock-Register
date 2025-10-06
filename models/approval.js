const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  request_type: { type: String, enum: ['Repair', 'Upgrade', 'Scrap', 'New Asset', 'Other'], required: true },
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  request_data: { type: Object },
  comments: { type: String },
  created_at: { type: Date, default: Date.now },
  approved_at: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Approval', approvalSchema);
