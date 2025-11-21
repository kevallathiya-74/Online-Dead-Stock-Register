/**
 * Migration Script: Normalize Asset Condition Enum Values
 * 
 * Purpose: Convert capitalized condition values to lowercase to match schema
 * Date: November 21, 2025
 * 
 * Background:
 * - Backend schema expects: ['excellent', 'good', 'fair', 'poor', 'damaged']
 * - Old frontend was sending: ['Excellent', 'Good', 'Fair', 'Poor']
 * - This script normalizes existing DB records
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/asset-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Asset = require('../models/asset');

async function normalizeConditionValues() {
  console.log('🔄 Starting condition enum normalization...\n');

  const db = mongoose.connection.db;
  const assetsCollection = db.collection('assets');

  // Mapping of old capitalized values to new lowercase values
  const conditionMapping = {
    'Excellent': 'excellent',
    'Good': 'good',
    'Fair': 'fair',
    'Poor': 'poor',
    'Damaged': 'damaged',
    'Obsolete': 'poor',  // Map obsolete to poor
    'Beyond Repair': 'damaged',  // Map beyond repair to damaged
    'Non-functional': 'damaged'  // Map non-functional to damaged
  };

  let totalUpdated = 0;

  // Process each mapping
  for (const [oldValue, newValue] of Object.entries(conditionMapping)) {
    const result = await assetsCollection.updateMany(
      { condition: oldValue },
      { $set: { condition: newValue } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} assets: "${oldValue}" → "${newValue}"`);
      totalUpdated += result.modifiedCount;
    }
  }

  // Check for any remaining invalid values
  const validConditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
  const invalidAssets = await assetsCollection.find({
    condition: { $nin: validConditions }
  }).toArray();

  if (invalidAssets.length > 0) {
    console.log(`\n⚠️  Found ${invalidAssets.length} assets with invalid condition values:`);
    invalidAssets.forEach(asset => {
      console.log(`   - Asset ID: ${asset.unique_asset_id}, Condition: "${asset.condition}"`);
    });

    // Set default for invalid conditions
    const defaultResult = await assetsCollection.updateMany(
      { condition: { $nin: validConditions } },
      { $set: { condition: 'good' } }
    );

    console.log(`✅ Set ${defaultResult.modifiedCount} invalid conditions to default "good"`);
    totalUpdated += defaultResult.modifiedCount;
  }

  // Summary statistics
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  
  const conditionStats = await assetsCollection.aggregate([
    {
      $group: {
        _id: '$condition',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('\nCurrent Condition Distribution:');
  conditionStats.forEach(stat => {
    const emoji = 
      stat._id === 'excellent' ? '🟢' :
      stat._id === 'good' ? '🔵' :
      stat._id === 'fair' ? '🟡' :
      stat._id === 'poor' ? '🟠' : '🔴';
    console.log(`  ${emoji} ${stat._id}: ${stat.count} assets`);
  });

  const totalAssets = await assetsCollection.countDocuments();
  console.log(`\n✅ Total Assets: ${totalAssets}`);
  console.log(`✅ Updated: ${totalUpdated} assets`);
  console.log(`✅ Status: All condition values normalized`);
  console.log('═══════════════════════════════════════════════════════\n');

  return totalUpdated;
}

// Run the migration
normalizeConditionValues()
  .then(count => {
    console.log(`✅ Migration completed successfully. ${count} assets updated.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
