const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Asset = require('../models/asset');
const User = require('../models/user'); // Need to load User model for populate to work

async function verifyAssets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all assets
    const assets = await Asset.find()
      .populate('assigned_user', 'name email department')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`📦 Total Assets in Database: ${assets.length}\n`);

    if (assets.length === 0) {
      console.log('⚠️  No assets found in database');
      return;
    }

    console.log('📋 Recent Assets:\n');
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.unique_asset_id} - ${asset.manufacturer} ${asset.model}`);
      console.log(`   Type: ${asset.asset_type}`);
      console.log(`   Department: ${asset.department}`);
      console.log(`   Status: ${asset.status} | Condition: ${asset.condition}`);
      console.log(`   Location: ${asset.location}`);
      console.log(`   Cost: ₹${asset.purchase_cost?.toLocaleString('en-IN') || 'N/A'}`);
      if (asset.assigned_user) {
        console.log(`   Assigned to: ${asset.assigned_user.name} (${asset.assigned_user.department})`);
      } else {
        console.log(`   Assigned to: Unassigned`);
      }
      console.log(`   Serial: ${asset.serial_number}`);
      console.log(`   Configuration: ${Object.keys(asset.configuration || {}).length} fields`);
      console.log('');
    });

    // Statistics
    console.log('📊 Statistics:\n');
    
    const totalValue = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ]);
    console.log(`💰 Total Asset Value: ₹${totalValue[0]?.total.toLocaleString('en-IN') || 0}`);

    const byDepartment = await Asset.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, value: { $sum: '$purchase_cost' } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\n🏢 By Department:');
    byDepartment.forEach(dept => {
      console.log(`   ${dept._id}: ${dept.count} assets (₹${dept.value.toLocaleString('en-IN')})`);
    });

    const byType = await Asset.aggregate([
      { $group: { _id: '$asset_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\n📦 By Asset Type:');
    byType.forEach(type => {
      console.log(`   ${type._id}: ${type.count} asset(s)`);
    });

    const byStatus = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\n📊 By Status:');
    byStatus.forEach(status => {
      console.log(`   ${status._id}: ${status.count} asset(s)`);
    });

    const byCondition = await Asset.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\n⭐ By Condition:');
    byCondition.forEach(cond => {
      console.log(`   ${cond._id}: ${cond.count} asset(s)`);
    });

    const assigned = await Asset.countDocuments({ assigned_user: { $ne: null } });
    const unassigned = await Asset.countDocuments({ assigned_user: null });
    console.log('\n👤 Assignment Status:');
    console.log(`   Assigned: ${assigned} asset(s)`);
    console.log(`   Unassigned: ${unassigned} asset(s)`);

    console.log('\n✨ Verification completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

verifyAssets();
