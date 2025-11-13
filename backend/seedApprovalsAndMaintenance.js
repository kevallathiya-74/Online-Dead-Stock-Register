const mongoose = require('mongoose');
const Approval = require('./models/approval');
const Maintenance = require('./models/maintenance');
const Asset = require('./models/asset');
const User = require('./models/user');
const Vendor = require('./models/vendor');
require('dotenv').config();

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dead-stock-register');
    console.log('✅ Connected to MongoDB');

    // Get existing users
    const users = await User.find().limit(5);
    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }
    console.log(`✅ Found ${users.length} users`);

    // Get existing assets
    const assets = await Asset.find().limit(10);
    if (assets.length === 0) {
      console.log('❌ No assets found. Please seed assets first.');
      return;
    }
    console.log(`✅ Found ${assets.length} assets`);

    // Get existing vendors
    const vendors = await Vendor.find().limit(5);
    console.log(`✅ Found ${vendors.length} vendors`);

    // Clear existing data
    await Approval.deleteMany({});
    await Maintenance.deleteMany({});
    console.log('✅ Cleared existing approvals and maintenance records');

    // Create sample approvals
    const approvalData = [
      {
        request_type: 'Repair',
        asset_id: assets[0]._id,
        requested_by: users[0]._id,
        approver: users[1]._id,
        status: 'Pending',
        request_data: {
          reason: 'Monitor screen flickering, needs immediate repair',
          estimated_cost: 5000,
          priority: 'HIGH'
        },
        comments: 'Urgent repair required for critical workstation',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        request_type: 'Upgrade',
        asset_id: assets[1]._id,
        requested_by: users[1]._id,
        approver: users[0]._id,
        status: 'Accepted',
        request_data: {
          reason: 'RAM upgrade from 8GB to 16GB for better performance',
          estimated_cost: 8000,
          priority: 'MEDIUM'
        },
        comments: 'Approved for Q1 budget',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        approved_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        request_type: 'Scrap',
        asset_id: assets[2]._id,
        requested_by: users[2]._id,
        approver: users[0]._id,
        status: 'Rejected',
        request_data: {
          reason: 'Old printer beyond repair, recommend disposal',
          estimated_cost: 0,
          priority: 'LOW'
        },
        comments: 'Can be repaired. Rejected for now.',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        approved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        request_type: 'New Asset',
        asset_id: null,
        requested_by: users[3]._id,
        approver: users[0]._id,
        status: 'Pending',
        request_data: {
          reason: 'New development team needs 5 laptops',
          estimated_cost: 450000,
          priority: 'CRITICAL',
          specifications: 'Intel i7, 16GB RAM, 512GB SSD'
        },
        comments: 'Pending budget approval',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        request_type: 'Repair',
        asset_id: assets[3]._id,
        requested_by: users[4]._id,
        status: 'Pending',
        request_data: {
          reason: 'Laptop keyboard not working properly',
          estimated_cost: 3500,
          priority: 'MEDIUM'
        },
        created_at: new Date()
      }
    ];

    const approvals = await Approval.insertMany(approvalData);
    console.log(`✅ Created ${approvals.length} approval records`);

    // Create sample maintenance records
    const maintenanceData = [
      {
        asset_id: assets[0]._id,
        maintenance_type: 'Preventive',
        description: 'Quarterly system cleaning and hardware check',
        cost: 2000,
        vendor_id: vendors.length > 0 ? vendors[0]._id : null,
        maintenance_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        next_maintenance_date: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        performed_by: 'Tech Solutions Inc.',
        status: 'Completed',
        created_by: users[0]._id
      },
      {
        asset_id: assets[1]._id,
        maintenance_type: 'Corrective',
        description: 'Fixed network card driver issue',
        cost: 1500,
        vendor_id: vendors.length > 1 ? vendors[1]._id : null,
        maintenance_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        next_maintenance_date: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        performed_by: 'Internal IT Team',
        status: 'Completed',
        created_by: users[1]._id
      },
      {
        asset_id: assets[2]._id,
        maintenance_type: 'Preventive',
        description: 'Annual printer maintenance and calibration',
        cost: 3000,
        vendor_id: vendors.length > 0 ? vendors[0]._id : null,
        maintenance_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        next_maintenance_date: new Date(Date.now() + 370 * 24 * 60 * 60 * 1000),
        performed_by: 'HP Service Center',
        status: 'Pending',
        created_by: users[0]._id
      },
      {
        asset_id: assets[3]._id,
        maintenance_type: 'Emergency',
        description: 'Water damage repair - urgent',
        cost: 12000,
        vendor_id: vendors.length > 2 ? vendors[2]._id : null,
        maintenance_date: new Date(),
        performed_by: 'Dell Authorized Service',
        status: 'Pending',
        created_by: users[2]._id
      },
      {
        asset_id: assets[4]._id,
        maintenance_type: 'Preventive',
        description: 'Software updates and security patches',
        cost: 0,
        maintenance_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        next_maintenance_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        performed_by: 'Internal IT Team',
        status: 'Completed',
        created_by: users[3]._id
      },
      {
        asset_id: assets[5] || assets[0],
        maintenance_type: 'Corrective',
        description: 'Replace faulty power supply',
        cost: 4500,
        vendor_id: vendors.length > 0 ? vendors[0]._id : null,
        maintenance_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        performed_by: 'Tech Solutions Inc.',
        status: 'Pending',
        created_by: users[1]._id
      },
      {
        asset_id: assets[6] || assets[1],
        maintenance_type: 'Preventive',
        description: 'Monthly backup verification and system check',
        cost: 1000,
        maintenance_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        next_maintenance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        performed_by: 'Internal IT Team',
        status: 'Completed',
        created_by: users[4]._id
      }
    ];

    const maintenance = await Maintenance.insertMany(maintenanceData);
    console.log(`✅ Created ${maintenance.length} maintenance records`);

    console.log('\n✅ Seed completed successfully!');
    console.log(`   - ${approvals.length} approvals created`);
    console.log(`   - ${maintenance.length} maintenance records created`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedData();
