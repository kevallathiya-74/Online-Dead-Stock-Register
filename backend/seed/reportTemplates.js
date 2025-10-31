const mongoose = require('mongoose');
const ReportTemplate = require('../models/reportTemplate');
const logger = require('../utils/logger');

// Report templates configuration
const templates = [
  {
    template_id: 'RPT-001',
    name: 'Asset Inventory Summary',
    description: 'Complete overview of all assets with current status and location',
    category: 'Inventory',
    frequency: 'weekly',
    type: 'summary',
    parameters: {
      dateRange: true,
      location: true,
      category: true,
      status: true
    },
    status: 'active',
    format: ['PDF', 'Excel', 'CSV'],
    is_scheduled: false
  },
  {
    template_id: 'RPT-002',
    name: 'Asset Utilization Analytics',
    description: 'Track asset usage patterns and identify underutilized resources',
    category: 'Analytics',
    frequency: 'monthly',
    type: 'analytics',
    parameters: {
      dateRange: true,
      department: true,
      assetType: true
    },
    status: 'active',
    format: ['PDF', 'Excel'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'monthly',
      day_of_month: 1,
      time: '09:00'
    }
  },
  {
    template_id: 'RPT-003',
    name: 'Maintenance Cost Analysis',
    description: 'Detailed breakdown of maintenance expenses by asset and department',
    category: 'Financial',
    frequency: 'monthly',
    type: 'analytics',
    parameters: {
      dateRange: true,
      assetCategory: true,
      maintenanceType: true
    },
    status: 'active',
    format: ['PDF', 'Excel'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'monthly',
      day_of_month: 5,
      time: '10:00'
    }
  },
  {
    template_id: 'RPT-004',
    name: 'Vendor Performance Report',
    description: 'Evaluate vendor reliability and delivery timelines',
    category: 'Vendor',
    frequency: 'quarterly',
    type: 'summary',
    parameters: {
      dateRange: true,
      vendorCategory: true,
      performanceMetrics: true
    },
    status: 'active',
    format: ['PDF', 'Excel'],
    is_scheduled: false
  },
  {
    template_id: 'RPT-005',
    name: 'Asset Depreciation Schedule',
    description: 'Calculate current asset values with depreciation analysis',
    category: 'Financial',
    frequency: 'yearly',
    type: 'detailed',
    parameters: {
      dateRange: true,
      depreciationMethod: true,
      assetCategory: true
    },
    status: 'active',
    format: ['PDF', 'Excel'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'yearly',
      day_of_month: 1,
      time: '08:00'
    }
  },
  {
    template_id: 'RPT-006',
    name: 'Compliance Audit Report',
    description: 'Ensure regulatory compliance and identify gaps',
    category: 'Compliance',
    frequency: 'monthly',
    type: 'compliance',
    parameters: {
      dateRange: true,
      complianceType: true,
      department: true
    },
    status: 'active',
    format: ['PDF'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'monthly',
      day_of_month: 15,
      time: '11:00'
    }
  },
  {
    template_id: 'RPT-007',
    name: 'Asset Movement Tracking',
    description: 'Track asset transfers between locations and departments',
    category: 'Tracking',
    frequency: 'weekly',
    type: 'detailed',
    parameters: {
      dateRange: true,
      location: true,
      movementType: true
    },
    status: 'active',
    format: ['PDF', 'Excel', 'CSV'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'weekly',
      day_of_week: 1, // Monday
      time: '09:00'
    }
  },
  {
    template_id: 'RPT-008',
    name: 'User Activity Dashboard',
    description: 'Monitor user actions and system usage metrics',
    category: 'System',
    frequency: 'daily',
    type: 'analytics',
    parameters: {
      dateRange: true,
      userRole: true,
      activityType: true
    },
    status: 'active',
    format: ['PDF', 'Excel'],
    is_scheduled: true,
    schedule_config: {
      frequency: 'daily',
      time: '08:00'
    }
  }
];

/**
 * Seed report templates into database
 */
const seedReportTemplates = async () => {
  try {
    console.log('Starting report templates seeding...');

    // Check if templates already exist
    const existingCount = await ReportTemplate.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing templates. Skipping seed.`);
      console.log('To force reseed, delete existing templates first.');
      return;
    }

    // Insert templates
    const insertedTemplates = await ReportTemplate.insertMany(templates);
    console.log(`✓ Successfully seeded ${insertedTemplates.length} report templates`);

    // Display summary
    console.log('\nSeeded Templates:');
    insertedTemplates.forEach(template => {
      console.log(`  - ${template.template_id}: ${template.name} (${template.category})`);
    });

    return insertedTemplates;
  } catch (error) {
    console.error('Error seeding report templates:', error);
    throw error;
  }
};

/**
 * Clear all report templates (use with caution)
 */
const clearReportTemplates = async () => {
  try {
    const result = await ReportTemplate.deleteMany({});
    console.log(`✓ Cleared ${result.deletedCount} report templates`);
    return result;
  } catch (error) {
    console.error('Error clearing report templates:', error);
    throw error;
  }
};

// If this script is run directly
if (require.main === module) {
  require('dotenv').config();
  const dbConfig = require('../config/db');
  
  // Connect to database
  mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/asset_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for command line argument
    const args = process.argv.slice(2);
    if (args.includes('--clear')) {
      await clearReportTemplates();
    } else {
      await seedReportTemplates();
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
}

module.exports = { seedReportTemplates, clearReportTemplates };
