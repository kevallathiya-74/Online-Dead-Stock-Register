const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/user');

// Test users for all roles
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'ADMIN',
    department: 'ADMIN',
    employee_id: 'EMP-ADMIN-001',
    phone: '+1234567890'
  },
  {
    name: 'Inventory Manager',
    email: 'inventory@test.com',
    password: 'inventory123',
    role: 'INVENTORY_MANAGER',
    department: 'INVENTORY',
    employee_id: 'EMP-INV-001',
    phone: '+1234567891'
  },
  {
    name: 'IT Manager',
    email: 'it.manager@test.com',
    password: 'itmanager123',
    role: 'INVENTORY_MANAGER',
    department: 'IT',
    employee_id: 'EMP-IT-001',
    phone: '+1234567892'
  },
  {
    name: 'Auditor User',
    email: 'auditor@test.com',
    password: 'auditor123',
    role: 'AUDITOR',
    department: 'ADMIN',
    employee_id: 'EMP-AUD-001',
    phone: '+1234567893'
  },
  {
    name: 'Employee One',
    email: 'employee1@test.com',
    password: 'employee123',
    role: 'EMPLOYEE',
    department: 'INVENTORY',
    employee_id: 'EMP-001',
    phone: '+1234567894'
  },
  {
    name: 'Employee Two',
    email: 'employee2@test.com',
    password: 'employee123',
    role: 'EMPLOYEE',
    department: 'IT',
    employee_id: 'EMP-002',
    phone: '+1234567895'
  },
  {
    name: 'Vendor User',
    email: 'vendor@test.com',
    password: 'vendor123',
    role: 'VENDOR',
    department: 'VENDOR',
    employee_id: 'EMP-VEN-001',
    phone: '+1234567896'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🌱 Starting user seeding...\n');

    let created = 0;
    let skipped = 0;

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email} (${userData.role})`);
          skipped++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword,
          is_active: true,
          created_at: new Date()
        });

        await user.save();
        console.log(`✅ Created: ${userData.email} (${userData.role} - ${userData.department})`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${created} users`);
    console.log(`   Skipped: ${skipped} users (already exist)`);
    console.log(`   Total: ${testUsers.length} users\n`);

    console.log('📋 Test Account Credentials:\n');
    console.log('┌─────────────────────┬──────────────────────┬──────────────────┬──────────────┐');
    console.log('│ Role                │ Email                │ Password         │ Department   │');
    console.log('├─────────────────────┼──────────────────────┼──────────────────┼──────────────┤');
    testUsers.forEach(user => {
      const role = user.role.padEnd(19);
      const email = user.email.padEnd(20);
      const password = user.password.padEnd(16);
      const dept = user.department.padEnd(12);
      console.log(`│ ${role} │ ${email} │ ${password} │ ${dept} │`);
    });
    console.log('└─────────────────────┴──────────────────────┴──────────────────┴──────────────┘\n');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
