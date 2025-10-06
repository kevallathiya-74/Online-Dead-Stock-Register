const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  document_type: { type: String, enum: ['Invoice', 'Scrap Certificate', 'Repair Bill', 'Other'], required: true },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaded_at: { type: Date, default: Date.now },
  description: { type: String }
});

module.exports = mongoose.model('Document', documentSchema);
