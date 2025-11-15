const mongoose = require('mongoose');

const settingsHistorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['security', 'database', 'email', 'application', 'all'],
      index: true,
    },
    field: {
      type: String,
      required: true,
      index: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'settings_history',
  }
);

// Compound indexes for efficient querying
settingsHistorySchema.index({ category: 1, createdAt: -1 });
settingsHistorySchema.index({ changedBy: 1, createdAt: -1 });
settingsHistorySchema.index({ field: 1, createdAt: -1 });

// Static method to log a change
settingsHistorySchema.statics.logChange = async function (options) {
  const { category, field, oldValue, newValue, userId, ipAddress, userAgent, reason } = options;

  // Don't log if values are the same
  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return null;
  }

  const historyEntry = await this.create({
    category,
    field,
    oldValue,
    newValue,
    changedBy: userId,
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    reason,
  });

  return historyEntry;
};

// Static method to get history with filters
settingsHistorySchema.statics.getHistory = async function (filters = {}) {
  const {
    category,
    field,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const query = {};

  if (category) query.category = category;
  if (field) query.field = field;
  if (userId) query.changedBy = userId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const total = await this.countDocuments(query);
  const history = await this.find(query)
    .populate('changedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    history,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

// Static method to get recent changes
settingsHistorySchema.statics.getRecentChanges = async function (limit = 10) {
  return await this.find()
    .populate('changedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get user activity
settingsHistorySchema.statics.getUserActivity = async function (userId, limit = 20) {
  return await this.find({ changedBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Virtual for formatted change description
settingsHistorySchema.virtual('changeDescription').get(function () {
  return `Changed ${this.field} from "${this.oldValue}" to "${this.newValue}"`;
});

// Ensure virtuals are included in JSON
settingsHistorySchema.set('toJSON', { virtuals: true });
settingsHistorySchema.set('toObject', { virtuals: true });

const SettingsHistory = mongoose.model('SettingsHistory', settingsHistorySchema);

module.exports = SettingsHistory;
