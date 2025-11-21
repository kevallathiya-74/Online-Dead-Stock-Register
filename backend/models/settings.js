const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Security Settings
    security: {
      sessionTimeout: {
        type: Number,
        required: true,
        default: 30,
        min: [5, 'Session timeout must be at least 5 minutes'],
        max: [1440, 'Session timeout cannot exceed 1440 minutes (24 hours)'],
      },
      passwordExpiry: {
        type: Number,
        required: true,
        default: 90,
        min: [0, 'Password expiry must be at least 0 days (0 = never)'],
        max: [365, 'Password expiry cannot exceed 365 days'],
      },
      maxLoginAttempts: {
        type: Number,
        required: true,
        default: 5,
        min: [3, 'Max login attempts must be at least 3'],
        max: [10, 'Max login attempts cannot exceed 10'],
      },
      twoFactorAuth: {
        type: Boolean,
        required: true,
        default: false,
      },
      passwordMinLength: {
        type: Number,
        required: true,
        default: 8,
        min: [6, 'Password minimum length must be at least 6'],
        max: [32, 'Password minimum length cannot exceed 32'],
      },
      requireSpecialChar: {
        type: Boolean,
        required: true,
        default: true,
      },
      requireNumber: {
        type: Boolean,
        required: true,
        default: true,
      },
      requireUppercase: {
        type: Boolean,
        required: true,
        default: true,
      },
    },

    // Database Settings
    database: {
      backupEnabled: {
        type: Boolean,
        required: true,
        default: true,
      },
      backupFrequency: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily',
      },
      backupRetention: {
        type: Number,
        required: true,
        default: 30,
        min: [7, 'Backup retention must be at least 7 days'],
        max: [365, 'Backup retention cannot exceed 365 days'],
      },
      backupLocation: {
        type: String,
        required: true,
        default: '/backups',
        trim: true,
      },
      connectionPoolSize: {
        type: Number,
        required: true,
        default: 10,
        min: [5, 'Connection pool size must be at least 5'],
        max: [100, 'Connection pool size cannot exceed 100'],
      },
      queryTimeout: {
        type: Number,
        required: true,
        default: 30000,
        min: [5000, 'Query timeout must be at least 5000ms (5 seconds)'],
        max: [300000, 'Query timeout cannot exceed 300000ms (5 minutes)'],
      },
    },

    // Email Settings
    email: {
      smtpHost: {
        type: String,
        required: true,
        default: 'smtp.gmail.com',
        trim: true,
      },
      smtpPort: {
        type: Number,
        required: true,
        default: 587,
        min: [1, 'SMTP port must be at least 1'],
        max: [65535, 'SMTP port cannot exceed 65535'],
      },
      smtpSecure: {
        type: Boolean,
        required: true,
        default: false,
      },
      smtpUser: {
        type: String,
        required: false,
        default: '',
        trim: true,
      },
      smtpPassword: {
        type: String,
        required: false,
        default: '',
        select: false, // Don't return password by default
      },
      fromEmail: {
        type: String,
        required: true,
        default: 'noreply@dsr.com',
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      },
      fromName: {
        type: String,
        required: true,
        default: 'DSR System',
        trim: true,
      },
      enableNotifications: {
        type: Boolean,
        required: true,
        default: true,
      },
    },

    // Application Settings
    application: {
      appName: {
        type: String,
        required: true,
        default: 'DSR - Dead Stock Register',
        trim: true,
        minlength: [3, 'App name must be at least 3 characters'],
        maxlength: [100, 'App name cannot exceed 100 characters'],
      },
      appVersion: {
        type: String,
        required: true,
        default: '1.0.0',
        trim: true,
      },
      timezone: {
        type: String,
        required: true,
        default: 'UTC',
        trim: true,
      },
      dateFormat: {
        type: String,
        required: true,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY',
      },
      currency: {
        type: String,
        required: true,
        default: 'INR',
        trim: true,
        uppercase: true,
        minlength: [3, 'Currency code must be 3 characters'],
        maxlength: [3, 'Currency code must be 3 characters'],
      },
      language: {
        type: String,
        required: true,
        default: 'en',
        trim: true,
        lowercase: true,
      },
      itemsPerPage: {
        type: Number,
        required: true,
        default: 10,
        min: [5, 'Items per page must be at least 5'],
        max: [100, 'Items per page cannot exceed 100'],
      },
      maintenanceMode: {
        type: Boolean,
        required: true,
        default: false,
      },
      maintenanceMessage: {
        type: String,
        default: 'System is under maintenance. Please check back later.',
        trim: true,
        maxlength: [500, 'Maintenance message cannot exceed 500 characters'],
      },
    },

    // Role-Based Access Control
    rolePermissions: {
      security: {
        type: [String],
        default: ['ADMIN'],
        enum: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'],
      },
      database: {
        type: [String],
        default: ['ADMIN'],
        enum: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'],
      },
      email: {
        type: [String],
        default: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'],
        enum: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'],
      },
      application: {
        type: [String],
        default: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'],
        enum: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'],
      },
    },

    // Metadata
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

// Indexes for faster queries
settingsSchema.index({ 'application.appName': 1 });
settingsSchema.index({ lastModifiedAt: -1 });

// Ensure only one settings document exists
settingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update settings with validation
settingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.getInstance();
  
  // Deep merge updates
  if (updates.security) {
    settings.security = { ...settings.security, ...updates.security };
  }
  if (updates.database) {
    settings.database = { ...settings.database, ...updates.database };
  }
  if (updates.email) {
    settings.email = { ...settings.email, ...updates.email };
  }
  if (updates.application) {
    settings.application = { ...settings.application, ...updates.application };
  }

  settings.lastModifiedBy = userId;
  settings.lastModifiedAt = new Date();

  await settings.validate();
  await settings.save();
  
  return settings;
};

// Search settings
settingsSchema.statics.searchSettings = async function (query) {
  const settings = await this.getInstance();
  const results = [];

  const searchTerm = query.toLowerCase();

  // Helper to search nested objects
  const searchNested = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        searchNested(value, fullPath);
      } else {
        const keyMatch = key.toLowerCase().includes(searchTerm);
        const valueMatch = String(value).toLowerCase().includes(searchTerm);
        
        if (keyMatch || valueMatch) {
          results.push({
            category: path || key,
            field: key,
            value: value,
            path: fullPath,
          });
        }
      }
    }
  };

  searchNested(settings.toObject());
  return results;
};

// Check if role has access to a category
settingsSchema.statics.hasAccess = async function (role, category) {
  const settings = await this.getInstance();
  
  if (!settings.rolePermissions || !settings.rolePermissions[category]) {
    // If no permissions defined, default to admin-only
    return role === 'ADMIN';
  }
  
  return settings.rolePermissions[category].includes(role);
};

// Filter settings based on user role
settingsSchema.statics.getFilteredSettings = async function (role) {
  const settings = await this.getInstance();
  const settingsObj = settings.toObject();
  const filtered = {};

  const categories = ['security', 'database', 'email', 'application'];
  
  for (const category of categories) {
    const hasAccess = await this.hasAccess(role, category);
    if (hasAccess) {
      filtered[category] = settingsObj[category];
    }
  }

  // Always include metadata
  filtered._id = settingsObj._id;
  filtered.lastModifiedBy = settingsObj.lastModifiedBy;
  filtered.lastModifiedAt = settingsObj.lastModifiedAt;
  filtered.createdAt = settingsObj.createdAt;
  filtered.updatedAt = settingsObj.updatedAt;
  filtered.rolePermissions = settingsObj.rolePermissions;

  return filtered;
};

// Get accessible categories for a role
settingsSchema.statics.getAccessibleCategories = async function (role) {
  const settings = await this.getInstance();
  const categories = ['security', 'database', 'email', 'application'];
  const accessible = [];

  for (const category of categories) {
    const hasAccess = await this.hasAccess(role, category);
    if (hasAccess) {
      accessible.push(category);
    }
  }

  return accessible;
};

// Update role permissions
settingsSchema.statics.updateRolePermissions = async function (category, roles) {
  const settings = await this.getInstance();
  
  if (!settings.rolePermissions) {
    settings.rolePermissions = {};
  }
  
  settings.rolePermissions[category] = roles;
  await settings.save();
  
  return settings;
};

// Pre-save middleware to update timestamp
settingsSchema.pre('save', function (next) {
  this.lastModifiedAt = new Date();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
