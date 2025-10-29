const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Vendor = require('../models/vendor');
const User = require('../models/user');

// Test vendor data
const testVendors = [
  {
    vendor_name: 'Tech Solutions Inc.',
    contact_person: 'Vendor User',
    email: 'vendor@test.com',
    phone: '+1234567896',
    address: {
      street: '123 Technology Drive',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'USA'
    },
    payment_terms: 'Net 30',
    is_active: true
  },
  {
    vendor_name: 'Global Supplies Co.',
    contact_person: 'John Smith',
    email: 'contact@globalsupplies.com',
    phone: '+1234567897',
    address: {
      street: '456 Commerce Boulevard',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'USA'
    },
    payment_terms: 'Net 45',
    is_active: true
  },
  {
    vendor_name: 'Electronics Depot',
    contact_person: 'Sarah Johnson',
    email: 'info@electronicsdepot.com',
    phone: '+1234567898',
    address: {
      street: '789 Industrial Parkway',
      city: 'Austin',
      state: 'TX',
      zip_code: '73301',
      country: 'USA'
    },
    payment_terms: 'Net 60',
    is_active: true
  }
];

async function seedVendors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🌱 Starting vendor seeding...\n');

    let created = 0;
    let skipped = 0;
    let linked = 0;

    for (const vendorData of testVendors) {
      try {
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email: vendorData.email });
        
        if (existingVendor) {
          console.log(`⚠️  Vendor already exists: ${vendorData.vendor_name} (${vendorData.email})`);
          skipped++;
          
          // Check if user needs linking
          if (vendorData.email === 'vendor@test.com') {
            const vendorUser = await User.findOne({ email: 'vendor@test.com' });
            if (vendorUser && !vendorUser.vendor_id) {
              vendorUser.vendor_id = existingVendor._id;
              await vendorUser.save();
              console.log(`   ✅ Linked vendor user to existing vendor record`);
              linked++;
            } else if (vendorUser && vendorUser.vendor_id) {
              console.log(`   ℹ️  Vendor user already linked`);
            }
          }
          continue;
        }

        // Create vendor
        const vendor = new Vendor({
          ...vendorData,
          created_at: new Date()
        });

        await vendor.save();
        console.log(`✅ Created: ${vendorData.vendor_name} (${vendorData.email})`);
        created++;

        // Link vendor user if this is the test vendor
        if (vendorData.email === 'vendor@test.com') {
          const vendorUser = await User.findOne({ email: 'vendor@test.com' });
          if (vendorUser) {
            vendorUser.vendor_id = vendor._id;
            await vendorUser.save();
            console.log(`   ✅ Linked vendor user account to vendor record`);
            linked++;
          } else {
            console.log(`   ⚠️  Vendor user not found. Please run seedUsers.js first.`);
          }
        }

      } catch (error) {
        console.error(`❌ Error creating ${vendorData.vendor_name}:`, error.message);
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${created} vendors`);
    console.log(`   Skipped: ${skipped} vendors (already exist)`);
    console.log(`   Linked: ${linked} vendor user accounts`);
    console.log(`   Total: ${testVendors.length} vendors\n`);

    console.log('📋 Test Vendor Details:\n');
    console.log('┌──────────────────────────┬──────────────────────────────┬──────────────┬──────────────┐');
    console.log('│ Vendor Name              │ Email                        │ Phone        │ Payment      │');
    console.log('├──────────────────────────┼──────────────────────────────┼──────────────┼──────────────┤');
    testVendors.forEach(vendor => {
      const name = vendor.vendor_name.padEnd(24);
      const email = vendor.email.padEnd(28);
      const phone = vendor.phone.padEnd(12);
      const terms = vendor.payment_terms.padEnd(12);
      console.log(`│ ${name} │ ${email} │ ${phone} │ ${terms} │`);
    });
    console.log('└──────────────────────────┴──────────────────────────────┴──────────────┴──────────────┘\n');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding vendors:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedVendors();
}

module.exports = seedVendors;
