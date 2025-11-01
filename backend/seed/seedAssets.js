const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Asset = require('../models/asset');
const User = require('../models/user');

// Comprehensive asset data with diverse categories
const assetData = [
  {
    unique_asset_id: 'ASSET-2025-001',
    manufacturer: 'Dell',
    model: 'XPS 15 9530',
    serial_number: 'DELL-SN-123456789',
    asset_type: 'Laptop',
    location: 'IT Department - Floor 2 - Room 201',
    status: 'Active',
    department: 'IT',
    purchase_date: new Date('2024-01-15'),
    purchase_cost: 125000,
    warranty_expiry: new Date('2027-01-15'),
    last_audit_date: new Date('2024-10-01'),
    condition: 'Excellent',
    configuration: {
      processor: 'Intel Core i7-13700H',
      ram: '16GB DDR5',
      storage: '512GB NVMe SSD',
      display: '15.6" FHD',
      os: 'Windows 11 Pro'
    },
    expected_lifespan: 5
  },
  {
    unique_asset_id: 'ASSET-2025-002',
    manufacturer: 'HP',
    model: 'LaserJet Pro M404dn',
    serial_number: 'HP-PRN-987654321',
    asset_type: 'Printer',
    location: 'Admin Department - Floor 1 - Reception',
    status: 'Active',
    department: 'ADMIN',
    purchase_date: new Date('2024-03-20'),
    purchase_cost: 35000,
    warranty_expiry: new Date('2026-03-20'),
    last_audit_date: new Date('2024-10-15'),
    condition: 'Good',
    configuration: {
      type: 'Laser Printer',
      color: 'Monochrome',
      speed: '40 ppm',
      connectivity: 'Ethernet, USB',
      duplex: 'Automatic'
    },
    expected_lifespan: 7
  },
  {
    unique_asset_id: 'ASSET-2025-003',
    manufacturer: 'Apple',
    model: 'iPhone 14 Pro',
    serial_number: 'APPLE-PH-456789123',
    asset_type: 'Mobile Device',
    location: 'IT Department - Floor 2',
    status: 'Active',
    department: 'IT',
    purchase_date: new Date('2024-02-10'),
    purchase_cost: 120000,
    warranty_expiry: new Date('2025-02-10'),
    last_audit_date: new Date('2024-10-20'),
    condition: 'Excellent',
    configuration: {
      storage: '256GB',
      color: 'Space Black',
      network: '5G',
      simType: 'Dual SIM (nano-SIM and eSIM)'
    },
    expected_lifespan: 3
  },
  {
    unique_asset_id: 'ASSET-2025-004',
    manufacturer: 'LG',
    model: '27UK850-W',
    serial_number: 'LG-MON-789456123',
    asset_type: 'Monitor',
    location: 'IT Department - Floor 2 - Workstation 5',
    status: 'Available',
    department: 'IT',
    purchase_date: new Date('2023-11-05'),
    purchase_cost: 45000,
    warranty_expiry: new Date('2026-11-05'),
    last_audit_date: new Date('2024-09-25'),
    condition: 'Good',
    configuration: {
      size: '27 inch',
      resolution: '4K UHD (3840x2160)',
      panel: 'IPS',
      refreshRate: '60Hz',
      ports: 'HDMI, DisplayPort, USB-C'
    },
    expected_lifespan: 6
  },
  {
    unique_asset_id: 'ASSET-2025-005',
    manufacturer: 'Lenovo',
    model: 'ThinkCentre M720q',
    serial_number: 'LENOVO-DT-321654987',
    asset_type: 'Desktop Computer',
    location: 'Inventory Department - Floor 1 - Desk 12',
    status: 'Active',
    department: 'INVENTORY',
    purchase_date: new Date('2024-04-18'),
    purchase_cost: 55000,
    warranty_expiry: new Date('2027-04-18'),
    last_audit_date: new Date('2024-10-10'),
    condition: 'Excellent',
    configuration: {
      processor: 'Intel Core i5-9500T',
      ram: '8GB DDR4',
      storage: '256GB SSD',
      formFactor: 'Tiny Desktop',
      os: 'Windows 10 Pro'
    },
    expected_lifespan: 5
  },
  {
    unique_asset_id: 'ASSET-2025-006',
    manufacturer: 'Cisco',
    model: 'Catalyst 2960-X',
    serial_number: 'CISCO-SW-654321789',
    asset_type: 'Network Switch',
    location: 'IT Department - Server Room - Rack 3',
    status: 'Active',
    department: 'IT',
    purchase_date: new Date('2023-08-12'),
    purchase_cost: 85000,
    warranty_expiry: new Date('2028-08-12'),
    last_audit_date: new Date('2024-10-05'),
    condition: 'Excellent',
    configuration: {
      ports: '48 x 1GB Ethernet',
      uplinks: '4 x 10GB SFP+',
      poe: 'PoE+ Supported',
      capacity: '740W',
      layer: 'Layer 2/3'
    },
    expected_lifespan: 10
  },
  {
    unique_asset_id: 'ASSET-2025-007',
    manufacturer: 'Herman Miller',
    model: 'Aeron Chair',
    serial_number: 'HM-CHAIR-159357246',
    asset_type: 'Office Furniture',
    location: 'Admin Department - Floor 3 - Office 301',
    status: 'Available',
    department: 'ADMIN',
    purchase_date: new Date('2024-05-22'),
    purchase_cost: 95000,
    warranty_expiry: new Date('2036-05-22'),
    last_audit_date: new Date('2024-09-30'),
    condition: 'Excellent',
    configuration: {
      size: 'B (Medium)',
      color: 'Graphite',
      features: 'Lumbar Support, Adjustable Arms, Tilt Limiter',
      material: 'Pellicle Mesh'
    },
    expected_lifespan: 12
  },
  {
    unique_asset_id: 'ASSET-2025-008',
    manufacturer: 'Canon',
    model: 'EOS R6 Mark II',
    serial_number: 'CANON-CAM-852963741',
    asset_type: 'Camera',
    location: 'Admin Department - Floor 1 - Media Room',
    status: 'Active',
    department: 'ADMIN',
    purchase_date: new Date('2024-06-30'),
    purchase_cost: 220000,
    warranty_expiry: new Date('2025-06-30'),
    last_audit_date: new Date('2024-10-18'),
    condition: 'Excellent',
    configuration: {
      sensor: '24.2MP Full-Frame CMOS',
      video: '4K 60fps',
      stabilization: 'In-Body 5-Axis',
      autofocus: 'Dual Pixel CMOS AF II',
      lens: 'RF 24-105mm f/4L IS USM'
    },
    expected_lifespan: 6
  },
  {
    unique_asset_id: 'ASSET-2025-009',
    manufacturer: 'APC',
    model: 'Smart-UPS 1500VA',
    serial_number: 'APC-UPS-741258963',
    asset_type: 'UPS',
    location: 'IT Department - Server Room - Row A',
    status: 'Active',
    department: 'IT',
    purchase_date: new Date('2023-12-08'),
    purchase_cost: 42000,
    warranty_expiry: new Date('2026-12-08'),
    last_audit_date: new Date('2024-10-12'),
    condition: 'Good',
    configuration: {
      capacity: '1500VA / 1000W',
      runtime: '20 minutes at full load',
      outlets: '8 x IEC 320 C13',
      interface: 'LCD Display, USB, Network Card',
      waveform: 'Pure Sine Wave'
    },
    expected_lifespan: 8
  },
  {
    unique_asset_id: 'ASSET-2025-010',
    manufacturer: 'Samsung',
    model: 'Galaxy Tab S9 Ultra',
    serial_number: 'SAMSUNG-TAB-369852147',
    asset_type: 'Tablet',
    location: 'Inventory Department - Floor 1 - Mobile Workstation',
    status: 'Available',
    department: 'INVENTORY',
    purchase_date: new Date('2024-07-15'),
    purchase_cost: 95000,
    warranty_expiry: new Date('2025-07-15'),
    last_audit_date: new Date('2024-10-22'),
    condition: 'Excellent',
    configuration: {
      display: '14.6" AMOLED',
      processor: 'Snapdragon 8 Gen 2',
      ram: '12GB',
      storage: '256GB',
      spen: 'Included',
      os: 'Android 13'
    },
    expected_lifespan: 4
  }
];

async function seedAssets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🌱 Starting asset seeding...\n');

    // Get sample users for potential assignment
    const users = await User.find({ role: { $in: ['EMPLOYEE', 'INVENTORY_MANAGER', 'IT_MANAGER'] } }).limit(5);
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Some assets will be created without assignment.');
    } else {
      console.log(`📋 Found ${users.length} users for potential asset assignment`);
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < assetData.length; i++) {
      const asset = assetData[i];
      
      try {
        // Check if asset already exists
        const existingAsset = await Asset.findOne({ unique_asset_id: asset.unique_asset_id });
        
        if (existingAsset) {
          console.log(`⚠️  Asset already exists: ${asset.unique_asset_id} (${asset.manufacturer} ${asset.model})`);
          skipped++;
          continue;
        }

        // Randomly assign some assets to users (50% chance)
        if (users.length > 0 && Math.random() > 0.5) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          asset.assigned_user = randomUser._id;
          console.log(`👤 Assigning to user: ${randomUser.name}`);
        }

        // Create asset
        const newAsset = await Asset.create(asset);
        console.log(`✅ Created: ${newAsset.unique_asset_id} - ${newAsset.manufacturer} ${newAsset.model} (${newAsset.asset_type})`);
        console.log(`   📍 Location: ${newAsset.location}`);
        console.log(`   💰 Cost: ₹${newAsset.purchase_cost.toLocaleString('en-IN')}`);
        console.log(`   📊 Status: ${newAsset.status} | Condition: ${newAsset.condition}`);
        console.log(`   🏢 Department: ${newAsset.department}`);
        console.log('');
        created++;

      } catch (error) {
        console.error(`❌ Error creating asset ${asset.unique_asset_id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created} assets`);
    console.log(`   ⚠️  Skipped: ${skipped} assets (already exist)`);
    console.log(`   ❌ Errors: ${errors} assets`);
    console.log(`   📦 Total processed: ${assetData.length} assets`);

    // Display category breakdown
    if (created > 0) {
      console.log('\n📋 Assets by Category:');
      const categories = await Asset.aggregate([
        { $group: { _id: '$asset_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      categories.forEach(cat => {
        console.log(`   • ${cat._id}: ${cat.count} asset(s)`);
      });

      console.log('\n🏢 Assets by Department:');
      const departments = await Asset.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      departments.forEach(dept => {
        console.log(`   • ${dept._id}: ${dept.count} asset(s)`);
      });

      console.log('\n💰 Total Asset Value:');
      const totalValue = await Asset.aggregate([
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]);
      if (totalValue.length > 0) {
        console.log(`   ₹${totalValue[0].total.toLocaleString('en-IN')}`);
      }
    }

    console.log('\n✨ Asset seeding completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedAssets();
