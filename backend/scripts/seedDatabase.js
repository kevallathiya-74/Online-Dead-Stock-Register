const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/user');
const Asset = require('../models/asset');
const Vendor = require('../models/vendor');
const ScheduledAudit = require('../models/scheduledAudit');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing test data...');
    await User.deleteMany({ email: { $regex: '@test.com$' } });
    await Asset.deleteMany({ unique_asset_id: { $regex: '^TEST-' } });
    await Vendor.deleteMany({ vendor_name: { $regex: '^Test ' } });
    await ScheduledAudit.deleteMany({ name: { $regex: '^Test ' } });
    console.log('✅ Test data cleared\n');

    // 1. Create Test Users
    console.log('👥 Creating test users...');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'ADMIN',
      employee_id: 'EMP001',
      is_active: true,
    });

    const inventoryManager = await User.create({
      name: 'Test Inventory Manager',
      email: 'inventory@test.com',
      password: hashedPassword,
      role: 'INVENTORY_MANAGER',
      department: 'INVENTORY',
      employee_id: 'EMP002',
      is_active: true,
    });

    const auditor = await User.create({
      name: 'Test Auditor',
      email: 'auditor@test.com',
      password: hashedPassword,
      role: 'AUDITOR',
      department: 'ADMIN',
      employee_id: 'EMP003',
      is_active: true,
    });

    const employee1 = await User.create({
      name: 'Test Employee 1',
      email: 'employee1@test.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      department: 'IT',
      employee_id: 'EMP004',
      is_active: true,
    });

    const employee2 = await User.create({
      name: 'Test Employee 2',
      email: 'employee2@test.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      department: 'INVENTORY',
      employee_id: 'EMP005',
      is_active: true,
    });

    console.log('✅ Created 5 test users\n');

    // 2. Create Test Vendors
    console.log('🏢 Creating test vendors...');
    const vendor1 = await Vendor.create({
      vendor_name: 'Test Dell Corporation',
      contact_person: 'John Dell',
      email: 'dell@test.com',
      phone: '+91-9876543210',
      address: '123 Tech Park, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      gst_number: '29ABCDE1234F1Z5',
      pan_number: 'ABCDE1234F',
      specialization: ['Laptops', 'Desktops', 'Monitors'],
      payment_terms: 'Net 30',
      credit_limit: 1000000,
      is_active: true,
    });

    const vendor2 = await Vendor.create({
      vendor_name: 'Test HP India',
      contact_person: 'Sarah HP',
      email: 'hp@test.com',
      phone: '+91-9876543211',
      address: '456 IT Hub, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gst_number: '27FGHIJ5678K2Z6',
      pan_number: 'FGHIJ5678K',
      specialization: ['Printers', 'Scanners', 'Servers'],
      payment_terms: 'Net 45',
      credit_limit: 800000,
      is_active: true,
    });

    const vendor3 = await Vendor.create({
      vendor_name: 'Test Lenovo India',
      contact_person: 'Mike Lenovo',
      email: 'lenovo@test.com',
      phone: '+91-9876543212',
      address: '789 Business Center, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      gst_number: '27KLMNO9012P3Q4',
      pan_number: 'KLMNO9012P',
      specialization: ['Laptops', 'Tablets', 'Accessories'],
      payment_terms: 'Net 30',
      credit_limit: 500000,
      is_active: true,
    });

    console.log('✅ Created 3 test vendors\n');

    // 3. Create Test Assets
    console.log('💻 Creating test assets...');
    const assetData = [
      { category: 'Laptop', brand: 'Dell', vendor: vendor1._id, price: 65000 },
      { category: 'Laptop', brand: 'HP', vendor: vendor2._id, price: 58000 },
      { category: 'Laptop', brand: 'Lenovo', vendor: vendor3._id, price: 52000 },
      { category: 'Desktop', brand: 'Dell', vendor: vendor1._id, price: 45000 },
      { category: 'Desktop', brand: 'HP', vendor: vendor2._id, price: 42000 },
      { category: 'Monitor', brand: 'Dell', vendor: vendor1._id, price: 15000 },
      { category: 'Monitor', brand: 'HP', vendor: vendor2._id, price: 13000 },
      { category: 'Printer', brand: 'HP', vendor: vendor2._id, price: 25000 },
      { category: 'Scanner', brand: 'HP', vendor: vendor2._id, price: 18000 },
      { category: 'Server', brand: 'Dell', vendor: vendor1._id, price: 250000 },
    ];

    const locations = ['Floor 1 - Cubicle 101', 'Floor 1 - Cubicle 102', 'Floor 2 - Conference Room', 'Floor 2 - Manager Cabin', 'Floor 3 - IT Department', 'Warehouse - Section A', 'Data Center'];
    const departments = ['IT', 'INVENTORY', 'ADMIN'];
    const statuses = ['Active', 'Available', 'Under Maintenance', 'Damaged'];
    const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
    const users = [employee1._id, employee2._id, inventoryManager._id, null];

    const assets = [];
    let assetCounter = 1;

    // Create multiple assets for each category
    for (let i = 0; i < assetData.length; i++) {
      const baseAsset = assetData[i];
      const count = baseAsset.category === 'Laptop' ? 15 : baseAsset.category === 'Monitor' ? 10 : 5;

      for (let j = 0; j < count; j++) {
        const purchaseDate = new Date();
        purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 1095)); // Random date within last 3 years

        const warrantyYears = baseAsset.category === 'Server' ? 5 : Math.random() > 0.5 ? 3 : 1;
        const warrantyDate = new Date(purchaseDate);
        warrantyDate.setFullYear(warrantyDate.getFullYear() + warrantyYears);

        // Some assets have warranty expiring soon
        const isExpiringSoon = Math.random() > 0.8;
        if (isExpiringSoon) {
          warrantyDate.setDate(new Date().getDate() + Math.floor(Math.random() * 60)); // Expire within 60 days
        }

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isAssigned = status === 'Active' ? users[Math.floor(Math.random() * users.length)] : null;

        assets.push({
          asset_tag: `TEST-${String(assetCounter).padStart(4, '0')}`,
          unique_asset_id: `TEST-${String(assetCounter).padStart(4, '0')}`,
          name: `${baseAsset.brand} ${baseAsset.category} ${j + 1}`,
          category: baseAsset.category,
          asset_type: baseAsset.category,
          brand: baseAsset.brand,
          manufacturer: baseAsset.brand,
          model: `${baseAsset.category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
          serial_number: `SN${Date.now()}${assetCounter}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          department: departments[Math.floor(Math.random() * departments.length)],
          assigned_user: isAssigned,
          vendor: baseAsset.vendor,
          purchase_price: baseAsset.price + Math.floor(Math.random() * 5000) - 2500,
          purchase_cost: baseAsset.price + Math.floor(Math.random() * 5000) - 2500,
          current_value: baseAsset.price * (0.6 + Math.random() * 0.3), // 60-90% of purchase price
          purchase_date: purchaseDate,
          warranty_expiry: warrantyDate,
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          status: status,
          description: `Test ${baseAsset.category} for seeding database`,
          specifications: {
            processor: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? 'Intel Core i7' : undefined,
            ram: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? '16GB' : undefined,
            storage: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? '512GB SSD' : undefined,
          },
          configuration: {
            processor: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? 'Intel Core i7' : undefined,
            ram: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? '16GB' : undefined,
            storage: baseAsset.category === 'Laptop' || baseAsset.category === 'Desktop' ? '512GB SSD' : undefined,
          },
          maintenance_history: [],
          qr_code: `QR-TEST-${String(assetCounter).padStart(4, '0')}`,
        });

        assetCounter++;
      }
    }

    const createdAssets = await Asset.insertMany(assets);
    console.log(`✅ Created ${createdAssets.length} test assets\n`);

    // 4. Create Test Scheduled Audits
    console.log('📅 Creating test scheduled audits...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(9, 0, 0, 0);

    const scheduledAudit1 = await ScheduledAudit.create({
      name: 'Test Weekly IT Equipment Audit',
      description: 'Weekly audit of all IT department equipment including laptops, desktops, and monitors',
      audit_type: 'full',
      recurrence_type: 'weekly',
      recurrence_config: {
        day_of_week: 1, // Monday
      },
      start_date: new Date(),
      next_run_date: tomorrow,
      is_active: true,
      scope_type: 'department',
      scope_config: { department: 'IT' },
      assigned_auditors: [auditor._id],
      checklist_template: [
        { item: 'Verify asset location', required: true },
        { item: 'Check physical condition', required: true },
        { item: 'Test functionality', required: true },
        { item: 'Update asset status', required: false },
      ],
      reminder_settings: {
        enabled: true,
        days_before: 1,
        send_email: true,
        send_notification: true,
      },
      created_by: admin._id,
    });

    const scheduledAudit2 = await ScheduledAudit.create({
      name: 'Test Monthly Full Inventory Audit',
      description: 'Complete inventory audit of all assets across all departments',
      audit_type: 'full',
      recurrence_type: 'monthly',
      recurrence_config: {
        day_of_month: 1,
      },
      start_date: new Date(),
      next_run_date: nextMonth,
      is_active: true,
      scope_type: 'all',
      scope_config: {},
      assigned_auditors: [auditor._id, inventoryManager._id],
      checklist_template: [
        { item: 'Verify asset exists', required: true },
        { item: 'Check asset condition', required: true },
        { item: 'Validate asset value', required: true },
        { item: 'Check warranty status', required: false },
        { item: 'Update depreciation', required: false },
      ],
      reminder_settings: {
        enabled: true,
        days_before: 3,
        send_email: true,
        send_notification: true,
      },
      created_by: admin._id,
    });

    const scheduledAudit3 = await ScheduledAudit.create({
      name: 'Test Quarterly Financial Asset Audit',
      description: 'Quarterly financial audit to verify asset values and depreciation',
      audit_type: 'condition',
      recurrence_type: 'quarterly',
      recurrence_config: {
        month: new Date().getMonth() + 3,
        day_of_month: 15,
      },
      start_date: new Date(),
      next_run_date: nextWeek,
      is_active: true,
      scope_type: 'category',
      scope_config: { category: 'Laptop' },
      assigned_auditors: [auditor._id],
      checklist_template: [
        { item: 'Verify purchase records', required: true },
        { item: 'Calculate current value', required: true },
        { item: 'Check depreciation schedule', required: true },
        { item: 'Update financial records', required: true },
      ],
      reminder_settings: {
        enabled: true,
        days_before: 5,
        send_email: true,
        send_notification: true,
      },
      created_by: admin._id,
    });

    console.log('✅ Created 3 test scheduled audits\n');

    // Summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('=====================================');
    console.log('👥 USERS CREATED: 5');
    console.log('   ├─ admin@test.com (ADMIN)');
    console.log('   ├─ inventory@test.com (INVENTORY_MANAGER)');
    console.log('   ├─ auditor@test.com (AUDITOR)');
    console.log('   ├─ employee1@test.com (EMPLOYEE - IT Dept)');
    console.log('   └─ employee2@test.com (EMPLOYEE - INVENTORY Dept)');
    console.log('   🔑 Password for all: Test@123');
    console.log('');
    console.log('🏢 VENDORS CREATED: 3');
    console.log('   ├─ Test Dell Corporation');
    console.log('   ├─ Test HP India');
    console.log('   └─ Test Lenovo India');
    console.log('');
    console.log(`💻 ASSETS CREATED: ${createdAssets.length}`);
    console.log('   ├─ Laptops: ~45');
    console.log('   ├─ Monitors: ~30');
    console.log('   ├─ Desktops: ~15');
    console.log('   └─ Others: ~20');
    console.log('');
    console.log('📅 SCHEDULED AUDITS: 3');
    console.log(`   ├─ Weekly IT Audit (Next run: ${tomorrow.toLocaleString()})`);
    console.log(`   ├─ Monthly Full Audit (Next run: ${nextMonth.toLocaleString()})`);
    console.log(`   └─ Quarterly Financial Audit (Next run: ${nextWeek.toLocaleString()})`);
    console.log('=====================================');
    console.log('');
    console.log('✅ Database is now populated with test data!');
    console.log('✅ Cron jobs will work with real data!');
    console.log('✅ You can now login and test the application!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Restart backend: npm start');
    console.log('   2. Login with: admin@test.com / Test@123');
    console.log('   3. Test the features with real data!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
