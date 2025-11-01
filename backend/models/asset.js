const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  unique_asset_id: { type: String, required: true, unique: true },
  name: { type: String },
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  serial_number: { type: String, required: true },
  asset_type: { type: String, required: true },
  location: { type: String, required: true },
  assigned_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Under Maintenance', 'Available', 'Damaged', 'Ready for Scrap'], default: 'Available' },
  department: { type: String, enum: ['INVENTORY', 'IT', 'ADMIN'], required: true },
  purchase_date: { type: Date },
  purchase_cost: { type: Number },
  warranty_expiry: { type: Date },
  last_audit_date: { type: Date },
  condition: { type: String },
  notes: { type: String },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  images: [{ type: String }],
  last_maintenance_date: { type: Date },
  configuration: { type: Object },
  expected_lifespan: { type: Number },
},{
  timestamps: true
});

// ========================================
// OPTIMIZED INDEXES FOR PERFORMANCE
// ========================================

// Compound indexes for common query patterns
assetSchema.index({ department: 1, status: 1 }); // Filter by dept & status
assetSchema.index({ assigned_user: 1, status: 1 }); // User's active assets
assetSchema.index({ status: 1, warranty_expiry: 1 }); // Warranty tracking
assetSchema.index({ asset_type: 1, department: 1 }); // Type by department
assetSchema.index({ purchase_date: -1 }); // Recent purchases (descending)
assetSchema.index({ location: 1, status: 1 }); // Location inventory
assetSchema.index({ createdAt: -1 }); // Recently created assets

// Text search index for full-text search across multiple fields
assetSchema.index({ 
  manufacturer: 'text', 
  model: 'text', 
  serial_number: 'text',
  unique_asset_id: 'text',
  location: 'text'
}, {
  name: 'asset_text_search',
  weights: {
    unique_asset_id: 10, // Higher weight for asset ID
    manufacturer: 5,
    model: 5,
    serial_number: 3,
    location: 1
  }
});

// Sparse index for assigned users (only when assigned)
assetSchema.index({ assigned_user: 1 }, { sparse: true });

// TTL index for automatic cleanup of scrapped assets (optional)
// assetSchema.index({ updatedAt: 1 }, { 
//   expireAfterSeconds: 31536000, // 1 year
//   partialFilterExpression: { status: 'Ready for Scrap' }
// });

module.exports = mongoose.model('Asset', assetSchema);