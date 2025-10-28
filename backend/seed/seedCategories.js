require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AssetCategory = require('../models/assetCategory');

const DEFAULT_CATEGORIES = [
  { name: 'Laptop', description: 'Portable computers for employees', color: '#1976d2' },
  { name: 'Desktop', description: 'Workstation desktop computers', color: '#2e7d32' },
  { name: 'Monitor', description: 'Displays and monitors', color: '#ed6c02' },
  { name: 'Printer', description: 'Office and network printers', color: '#9c27b0' },
  { name: 'Server', description: 'Data center server machines', color: '#455a64' },
  { name: 'Furniture', description: 'Office furniture and fixtures', color: '#6d4c41' },
  { name: 'Scanner', description: 'Document and barcode scanners', color: '#d32f2f' },
  { name: 'Networking', description: 'Routers, switches, and network gear', color: '#0288d1' },
];

async function run() {
  try {
    await connectDB();
    console.log('Connected. Seeding asset categories...');

    const existingCount = await AssetCategory.countDocuments();
    console.log(`Existing categories: ${existingCount}`);

    let created = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      const found = await AssetCategory.findOne({ name: cat.name });
      if (!found) {
        await AssetCategory.create(cat);
        created++;
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`↩︎ Skipped existing: ${cat.name}`);
      }
    }

    const total = await AssetCategory.countDocuments();
    console.log(`Done. Created ${created}, total now ${total}.`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Mongo connection closed.');
  }
}

run();
