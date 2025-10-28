/**
 * Seed script for Inventory Management features
 * Creates sample data for:
 * - Asset Categories
 * - Dead Stock Items
 * - Disposal Records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Asset = require('../models/asset');
const AssetCategory = require('../models/assetCategory');
const DisposalRecord = require('../models/disposalRecord');

// Sample Categories
const categories = [
  {
    name: 'Laptop',
    description: 'Portable computers for office and field work',
    color: '#1976d2',
    icon: 'Laptop',
    metadata: {
      depreciation_rate: 20,
      typical_lifespan_years: 5,
      maintenance_schedule: 'yearly'
    }
  },
  {
    name: 'Desktop',
    description: 'Desktop computers for office use',
    color: '#388e3c',
    icon: 'Computer',
    metadata: {
      depreciation_rate: 20,
      typical_lifespan_years: 6,
      maintenance_schedule: 'yearly'
    }
  },
  {
    name: 'Monitor',
    description: 'Display monitors and screens',
    color: '#f57c00',
    icon: 'Monitor',
    metadata: {
      depreciation_rate: 15,
      typical_lifespan_years: 7,
      maintenance_schedule: 'none'
    }
  },
  {
    name: 'Printer',
    description: 'Printers, scanners, and multifunction devices',
    color: '#7b1fa2',
    icon: 'Print',
    metadata: {
      depreciation_rate: 25,
      typical_lifespan_years: 4,
      maintenance_schedule: 'quarterly'
    }
  },
  {
    name: 'Server',
    description: 'Server hardware and infrastructure',
    color: '#c62828',
    icon: 'Storage',
    metadata: {
      depreciation_rate: 15,
      typical_lifespan_years: 8,
      maintenance_schedule: 'monthly'
    }
  },
  {
    name: 'Furniture',
    description: 'Office furniture including desks, chairs, cabinets',
    color: '#5d4037',
    icon: 'Weekend',
    metadata: {
      depreciation_rate: 10,
      typical_lifespan_years: 10,
      maintenance_schedule: 'yearly'
    }
  },
  {
    name: 'Scanner',
    description: 'Document scanners and imaging equipment',
    color: '#0097a7',
    icon: 'Scanner',
    metadata: {
      depreciation_rate: 20,
      typical_lifespan_years: 5,
      maintenance_schedule: 'yearly'
    }
  },
  {
    name: 'Networking',
    description: 'Routers, switches, and networking equipment',
    color: '#00796b',
    icon: 'Router',
    metadata: {
      depreciation_rate: 25,
      typical_lifespan_years: 4,
      maintenance_schedule: 'monthly'
    }
  }
];

// Function to mark random assets as dead stock
const markAssetsAsDeadStock = async () => {
  try {
    // Find assets that are in poor condition or damaged
    const candidateAssets = await Asset.find({
      $or: [
        { condition: 'Poor' },
        { status: { $in: ['Damaged', 'Under Maintenance'] } },
        { purchase_date: { $lt: new Date('2020-01-01') } }
      ]
    }).limit(25);

    console.log(`Found ${candidateAssets.length} candidate assets for dead stock`);

    const deadStockReasons = [
      'Obsolete Technology',
      'Beyond Repair',
      'Not Compatible with Current Systems',
      'Unused for 2+ Years',
      'Replacement Already Purchased',
      'End of Life',
      'Excessive Maintenance Costs'
    ];

    // Mark 15 random assets as dead stock (using 'Ready for Scrap' status)
    const assetsToMarkDeadStock = candidateAssets.slice(0, 15);
    
    for (const asset of assetsToMarkDeadStock) {
      asset.status = 'Ready for Scrap';
      asset.condition = deadStockReasons[Math.floor(Math.random() * deadStockReasons.length)];
      await asset.save();
    }

    console.log(`✅ Marked ${assetsToMarkDeadStock.length} assets as dead stock`);
    return assetsToMarkDeadStock;
  } catch (error) {
    console.error('Error marking assets as dead stock:', error);
    throw error;
  }
};

// Function to create disposal records
const createDisposalRecords = async (deadStockAssets) => {
  try {
    const disposalMethods = ['Auction', 'Scrap', 'Donation', 'Recycling', 'Sale'];
    const statuses = ['completed', 'pending', 'in_progress'];
    const approvers = ['Admin User', 'Inventory Manager', 'Department Head'];

    const disposalRecords = [];

    // Create 20 disposal records (using some of the dead stock assets)
    for (let i = 0; i < 20; i++) {
      const asset = deadStockAssets[i % deadStockAssets.length];
      const disposalDate = new Date();
      disposalDate.setDate(disposalDate.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days

      const record = {
        asset_id: asset.unique_asset_id,
        asset_name: `${asset.asset_type} - ${asset.model}`,
        category: asset.asset_type,
        disposal_date: disposalDate,
        disposal_method: disposalMethods[Math.floor(Math.random() * disposalMethods.length)],
        disposal_value: Math.floor(asset.purchase_cost * 0.1 + Math.random() * asset.purchase_cost * 0.2), // 10-30% of purchase cost
        approved_by: approvers[Math.floor(Math.random() * approvers.length)],
        document_reference: `DOC-2024-${3000 + i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        remarks: i % 3 === 0 ? 'No issues reported' : i % 2 === 0 ? 'Pending documentation' : 'Completed successfully'
      };

      disposalRecords.push(record);
    }

    await DisposalRecord.insertMany(disposalRecords);
    console.log(`✅ Created ${disposalRecords.length} disposal records`);
  } catch (error) {
    console.error('Error creating disposal records:', error);
    throw error;
  }
};

// Main seeding function
const seedInventoryData = async () => {
  try {
    console.log('🌱 Starting inventory data seeding...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing inventory data...');
    await AssetCategory.deleteMany({});
    await DisposalRecord.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Seed Categories
    console.log('📂 Creating asset categories...');
    await AssetCategory.insertMany(categories);
    console.log(`✅ Created ${categories.length} asset categories\n`);

    // Mark assets as dead stock
    console.log('💀 Marking assets as dead stock...');
    const deadStockAssets = await markAssetsAsDeadStock();
    console.log('');

    // Create disposal records
    console.log('📋 Creating disposal records...');
    await createDisposalRecords(deadStockAssets);
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Inventory data seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📂 Asset Categories: ${categories.length}`);
    console.log(`💀 Dead Stock Items: ${deadStockAssets.length}`);
    console.log(`📋 Disposal Records: 20`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 You can now test the following pages:');
    console.log('   - Dead Stock Items: http://localhost:3000/inventory/dead-stock');
    console.log('   - Disposal Records: http://localhost:3000/inventory/disposal');
    console.log('   - Categories: http://localhost:3000/assets/categories');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedInventoryData();
}

module.exports = { seedInventoryData };
