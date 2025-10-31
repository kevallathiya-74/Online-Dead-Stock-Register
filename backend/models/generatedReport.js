const mongoose = require('mongoose');

const generatedReportSchema = new mongoose.Schema(
  {
    report_id: {
      type: String,
      required: true,
      unique: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReportTemplate',
      required: true
    },
    report_name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Inventory', 'Analytics', 'Financial', 'Vendor', 'Compliance', 'Tracking', 'System']
    },
    generated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    generated_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      required: true,
      default: 'processing',
      enum: ['completed', 'processing', 'failed']
    },
    format: {
      type: String,
      required: true,
      enum: ['PDF', 'Excel', 'CSV', 'JSON']
    },
    file_path: {
      type: String
    },
    file_size: {
      type: Number // Size in bytes
    },
    download_count: {
      type: Number,
      default: 0
    },
    last_downloaded: {
      type: Date
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error_message: {
      type: String
    },
    data_summary: {
      total_records: Number,
      date_range: {
        start: Date,
        end: Date
      },
      filters_applied: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes
generatedReportSchema.index({ report_id: 1 });
generatedReportSchema.index({ generated_by: 1 });
generatedReportSchema.index({ category: 1 });
generatedReportSchema.index({ status: 1 });
generatedReportSchema.index({ generated_at: -1 });
generatedReportSchema.index({ template: 1 });

// Virtual for formatted file size
generatedReportSchema.virtual('file_size_formatted').get(function() {
  if (!this.file_size) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.file_size === 0) return '0 Bytes';
  const i = Math.floor(Math.log(this.file_size) / Math.log(1024));
  return Math.round(this.file_size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment download count
generatedReportSchema.methods.incrementDownload = async function() {
  this.download_count += 1;
  this.last_downloaded = new Date();
  return await this.save();
};

module.exports = mongoose.model('GeneratedReport', generatedReportSchema);
