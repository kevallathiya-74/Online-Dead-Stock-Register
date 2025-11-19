const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Maintenance = require('../models/maintenance');
const Asset = require('../models/asset');
const User = require('../models/user');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

const seedMaintenanceData = async () => {
  try {
    await connectDB();

    // Get existing assets
    const assets = await Asset.find().limit(5);
    if (assets.length === 0) {
      console.log('⚠️  No assets found. Please seed assets first.');
      process.exit(1);
    }

    // Get an admin or IT manager user
    const adminUser = await User.findOne({ 
      role: { $in: ['ADMIN', 'IT_MANAGER', 'INVENTORY_MANAGER'] } 
    });

    if (!adminUser) {
      console.log('⚠️  No admin/manager user found.');
      process.exit(1);
    }

    console.log(`Found ${assets.length} assets and user: ${adminUser.email}`);

    // Clear existing maintenance records
    const deletedCount = await Maintenance.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing maintenance records`);

    // Create maintenance records
    const maintenanceRecords = [
      {
        asset_id: assets[0]._id,
        maintenance_type: 'Preventive',
        description: 'Routine hardware inspection and cleaning',
        maintenance_date: new Date('2025-11-22'),
        next_maintenance_date: new Date('2026-02-22'),
        performed_by: 'John Smith',
        priority: 'Medium',
        status: 'Scheduled',
        cost: 2500,
        estimated_duration: 2,
        downtime_impact: 'Low',
        created_by: adminUser._id
      },
      {
        asset_id: assets[1]._id,
        maintenance_type: 'Corrective',
        description: 'Replace faulty power supply unit',
        maintenance_date: new Date('2025-11-25'),
        performed_by: 'Sarah Johnson',
        priority: 'High',
        status: 'Scheduled',
        cost: 4500,
        estimated_duration: 3,
        downtime_impact: 'Medium',
        created_by: adminUser._id
      },
      {
        asset_id: assets[2]._id,
        maintenance_type: 'Preventive',
        description: 'Software updates and security patches',
        maintenance_date: new Date('2025-12-01'),
        next_maintenance_date: new Date('2026-03-01'),
        performed_by: 'Mike Davis',
        priority: 'Medium',
        status: 'Scheduled',
        cost: 1500,
        estimated_duration: 1.5,
        downtime_impact: 'Low',
        created_by: adminUser._id
      }
    ];

    // Insert maintenance records
    const insertedRecords = await Maintenance.insertMany(maintenanceRecords);
    console.log(`✅ Successfully created ${insertedRecords.length} maintenance records`);

    // Display summary
    console.log('\n📊 Maintenance Records Summary:');
    insertedRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.maintenance_type} - ${record.description}`);
      console.log(`      Asset: ${record.asset_id}`);
      console.log(`      Date: ${record.maintenance_date.toISOString().split('T')[0]}`);
      console.log(`      Technician: ${record.performed_by}`);
      console.log(`      Priority: ${record.priority} | Status: ${record.status}`);
      console.log(`      Cost: ₹${record.cost.toLocaleString('en-IN')}`);
      console.log('');
    });

    console.log('✨ Maintenance data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding maintenance data:', error);
    process.exit(1);
  }
};

seedMaintenanceData();
