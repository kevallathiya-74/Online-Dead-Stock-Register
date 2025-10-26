const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/user');

// Test login function
async function testLogin(email, password) {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account is inactive');
      return false;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return false;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful!');
    console.log('   User ID:', user._id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Department:', user.department);
    console.log('   Token generated:', token.substring(0, 50) + '...');
    
    return true;

  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

// Test all user accounts
async function testAllLogins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('        TESTING ALL USER ACCOUNT LOGINS');
    console.log('═══════════════════════════════════════════════════════');

    const testAccounts = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'inventory@test.com', password: 'inventory123' },
      { email: 'it.manager@test.com', password: 'itmanager123' },
      { email: 'auditor@test.com', password: 'auditor123' },
      { email: 'employee1@test.com', password: 'employee123' },
      { email: 'employee2@test.com', password: 'employee123' },
      { email: 'vendor@test.com', password: 'vendor123' }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const account of testAccounts) {
      const result = await testLogin(account.email, account.password);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Successful logins: ${successCount}`);
    console.log(`❌ Failed logins: ${failCount}`);
    console.log(`📊 Total accounts tested: ${testAccounts.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (successCount === testAccounts.length) {
      console.log('🎉 All accounts are working perfectly!\n');
    } else {
      console.log('⚠️  Some accounts failed. Please check the errors above.\n');
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(successCount === testAccounts.length ? 0 : 1);

  } catch (error) {
    console.error('❌ Test error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testAllLogins();
}

module.exports = { testLogin, testAllLogins };
