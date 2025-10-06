const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  transaction_type: { type: String, enum: ['Asset Assignment', 'Asset Transfer', 'Check-out', 'Check-in', 'Maintenance', 'Return'], required: true },
  from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  from_location: { type: String },
  to_location: { type: String },
  quantity: { type: Number, default: 1 },
  notes: { type: String },
  transaction_date: { type: Date, default: Date.now },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Approved', 'Completed'], default: 'Pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
