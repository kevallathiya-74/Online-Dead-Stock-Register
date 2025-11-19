const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Asset = require('../models/asset');
const Maintenance = require('../models/maintenance');
const Vendor = require('../models/vendor');
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

const seedCompleteData = async () => {
  try {
    await connectDB();

    // Get existing vendors or use first 3
    let vendors = await Vendor.find().limit(3);
    
    // Get an admin or IT manager user
    const adminUser = await User.findOne({ 
      role: { $in: ['ADMIN', 'IT_MANAGER', 'INVENTORY_MANAGER'] } 
    });

    if (!adminUser) {
      console.log('⚠️  No admin/manager user found.');
      process.exit(1);
    }

    console.log(`Found user: ${adminUser.email}`);
    console.log(`Found ${vendors.length} vendors`);

    // Check if assets exist
    let assets = await Asset.find();
    
    if (assets.length === 0) {
      console.log('📦 No assets found. Creating sample assets...');
      
      // Create sample assets
      const assetData = [
        {
          unique_asset_id: 'DSR-LAP-001',
          name: 'Dell Latitude 5520',
          asset_type: 'Laptop',
          manufacturer: 'Dell',
          model: 'Latitude 5520',
          serial_number: 'DL5520-2024-001',
          status: 'Active',
          condition: 'Good',
          location: 'IT Department',
          purchase_date: new Date('2024-01-15'),
          purchase_cost: 65000,
          warranty_expiry: new Date('2027-01-15'),
          vendor: vendors[0]?._id,
          department: 'IT',
          created_by: adminUser._id
        },
        {
          unique_asset_id: 'DSR-DSK-002',
          name: 'HP EliteDesk 800',
          asset_type: 'Desktop',
          manufacturer: 'HP',
          model: 'EliteDesk 800 G6',
          serial_number: 'HP800-2024-002',
          status: 'Active',
          condition: 'Excellent',
          location: 'Admin Office',
          purchase_date: new Date('2024-02-20'),
          purchase_cost: 55000,
          warranty_expiry: new Date('2027-02-20'),
          vendor: vendors[1]?._id,
          department: 'ADMIN',
          created_by: adminUser._id
        },
        {
          unique_asset_id: 'DSR-LAP-003',
          name: 'Lenovo ThinkPad T14',
          asset_type: 'Laptop',
          manufacturer: 'Lenovo',
          model: 'ThinkPad T14 Gen 3',
          serial_number: 'LN-T14-2024-003',
          status: 'Active',
          condition: 'Good',
          location: 'Inventory Warehouse',
          purchase_date: new Date('2024-03-10'),
          purchase_cost: 70000,
          warranty_expiry: new Date('2027-03-10'),
          vendor: vendors[2]?._id,
          department: 'INVENTORY',
          created_by: adminUser._id
        },
        {
          unique_asset_id: 'DSR-SRV-004',
          name: 'Dell PowerEdge R740',
          asset_type: 'Server',
          manufacturer: 'Dell',
          model: 'PowerEdge R740',
          serial_number: 'DL-R740-2023-004',
          status: 'Active',
          condition: 'Excellent',
          location: 'Server Room',
          purchase_date: new Date('2023-11-01'),
          purchase_cost: 250000,
          warranty_expiry: new Date('2026-11-01'),
          vendor: vendors[0]?._id,
          department: 'IT',
          created_by: adminUser._id
        },
        {
          unique_asset_id: 'DSR-NET-005',
          name: 'Cisco Catalyst 9300',
          asset_type: 'Network Equipment',
          manufacturer: 'Cisco',
          model: 'Catalyst 9300-48P',
          serial_number: 'CS-9300-2024-005',
          status: 'Active',
          condition: 'Good',
          location: 'Server Room',
          purchase_date: new Date('2024-01-20'),
          purchase_cost: 180000,
          warranty_expiry: new Date('2029-01-20'),
          vendor: vendors[0]?._id,
          department: 'IT',
          created_by: adminUser._id
        }
      ];

      assets = await Asset.insertMany(assetData);
      console.log(`✅ Created ${assets.length} sample assets`);
    } else {
      console.log(`✅ Found ${assets.length} existing assets`);
    }

    // Clear and create maintenance records
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

    const insertedRecords = await Maintenance.insertMany(maintenanceRecords);
    console.log(`✅ Successfully created ${insertedRecords.length} maintenance records`);

    // Display summary
    console.log('\n📊 Data Summary:');
    console.log(`   Assets: ${assets.length}`);
    console.log(`   Maintenance Records: ${insertedRecords.length}`);
    console.log('\n🔧 Maintenance Records:');
    insertedRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.maintenance_type} - ${record.description}`);
      console.log(`      Date: ${record.maintenance_date.toISOString().split('T')[0]}`);
      console.log(`      Technician: ${record.performed_by}`);
      console.log(`      Priority: ${record.priority} | Status: ${record.status}`);
      console.log(`      Cost: ₹${record.cost.toLocaleString('en-IN')}`);
      console.log('');
    });

    console.log('✨ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedCompleteData();
