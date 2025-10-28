const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#1976d2',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} is not a valid hex color code!`
    }
  },
  icon: {
    type: String,
    default: 'Inventory'
  },
  active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    depreciation_rate: {
      type: Number,
      default: 0
    },
    typical_lifespan_years: {
      type: Number,
      default: 5
    },
    maintenance_schedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'none'],
      default: 'none'
    }
  }
}, {
  timestamps: true
});

// Indexes
assetCategorySchema.index({ name: 1 }, { unique: true });
assetCategorySchema.index({ active: 1 });

// Virtual for asset count (will be populated in controller)
assetCategorySchema.virtual('asset_count', {
  ref: 'Asset',
  localField: 'name',
  foreignField: 'asset_type',
  count: true
});

// Method to check if category can be deleted
assetCategorySchema.methods.canDelete = async function() {
  const Asset = mongoose.model('Asset');
  const count = await Asset.countDocuments({ asset_type: this.name });
  return count === 0;
};

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
