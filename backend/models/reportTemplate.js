const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema(
  {
    template_id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Inventory', 'Analytics', 'Financial', 'Vendor', 'Compliance', 'Tracking', 'System']
    },
    frequency: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'on-demand']
    },
    type: {
      type: String,
      required: true,
      enum: ['summary', 'detailed', 'analytics', 'compliance']
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive', 'archived']
    },
    format: {
      type: [String],
      default: ['PDF', 'Excel', 'CSV']
    },
    is_scheduled: {
      type: Boolean,
      default: false
    },
    schedule_config: {
      frequency: String,
      day_of_week: Number,
      day_of_month: Number,
      time: String
    },
    last_generated: {
      type: Date
    },
    generation_count: {
      type: Number,
      default: 0
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reportTemplateSchema.index({ template_id: 1 });
reportTemplateSchema.index({ category: 1 });
reportTemplateSchema.index({ status: 1 });

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
