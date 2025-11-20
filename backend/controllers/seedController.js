const Asset = require('../models/asset');
const Vendor = require('../models/vendor');
const User = require('../models/user');
const Maintenance = require('../models/maintenance');
const logger = require('../utils/logger');

/**
 * DEVELOPMENT ONLY - Seed database with test data
 * This endpoint should be removed or disabled in production
 */
const seedDatabase = async (req, res) => {
  try {
    // Check if we're in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Seeding is not allowed in production'
      });
    }

    logger.info('Starting database seeding...');
    const results = {};

    // 1. Seed Vendors if needed
    let vendorCount = await Vendor.countDocuments();
    if (vendorCount === 0) {
      const vendorData = [
        {
          vendor_name: 'Dell Technologies India',
          vendor_code: 'VEND-DELL-001',
          contact_person: 'Rajesh Kumar',
          contact_email: 'rajesh.kumar@dell.com',
          phone: '+91-9876543210',
          vendor_type: 'IT Equipment',
          performance_rating: 4.5,
          is_active: true,
          categories: ['Laptops', 'Desktops', 'Servers'],
          gst_number: 'GST2345678901',
          payment_terms: 'Net 30'
        },
        {
          vendor_name: 'HP India Sales',
          vendor_code: 'VEND-HP-002',
          contact_person: 'Priya Sharma',
          contact_email: 'priya.sharma@hp.com',
          phone: '+91-9876543211',
          vendor_type: 'IT Equipment',
          performance_rating: 4.2,
          is_active: true,
          categories: ['Laptops', 'Desktops', 'Printers'],
          gst_number: 'GST3456789012',
          payment_terms: 'Net 45'
        },
        {
          vendor_name: 'Lenovo Enterprise',
          vendor_code: 'VEND-LEN-003',
          contact_person: 'Amit Patel',
          contact_email: 'amit.patel@lenovo.com',
          phone: '+91-9876543212',
          vendor_type: 'IT Equipment',
          performance_rating: 4.7,
          is_active: true,
          categories: ['Laptops', 'Servers', 'Workstations'],
          gst_number: 'GST4567890123',
          payment_terms: 'Net 30'
        }
      ];

      const vendors = await Vendor.insertMany(vendorData);
      results.vendors = {
        created: vendors.length,
        ids: vendors.map(v => v._id)
      };
      logger.info(`Created ${vendors.length} vendors`);
    } else {
      results.vendors = { existing: vendorCount };
    }

    // 2. Get or verify admin user exists
    let adminUser = await User.findOne({
      role: { $in: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'] }
    });

    if (!adminUser) {
      return res.status(400).json({
        success: false,
        error: 'No admin/manager user found. Please create users first through registration.'
      });
    }

    results.adminUser = {
      found: adminUser.email,
      role: adminUser.role
    };

    // 3. Seed Assets
    let assetCount = await Asset.countDocuments();
    if (assetCount === 0) {
      const vendors = await Vendor.find().limit(3);

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
          location: 'IT Department - Floor 3',
          purchase_date: new Date('2024-01-15'),
          purchase_cost: 65000,
          warranty_expiry: new Date('2027-01-15'),
          vendor: vendors[0]?._id,
          department: 'IT'
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
          location: 'Admin Office - Floor 2',
          purchase_date: new Date('2024-02-20'),
          purchase_cost: 55000,
          warranty_expiry: new Date('2027-02-20'),
          vendor: vendors[1]?._id,
          department: 'ADMIN'
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
          department: 'INVENTORY'
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
          location: 'Server Room - Basement',
          purchase_date: new Date('2023-11-01'),
          purchase_cost: 250000,
          warranty_expiry: new Date('2026-11-01'),
          vendor: vendors[0]?._id,
          department: 'IT'
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
          location: 'Server Room - Basement',
          purchase_date: new Date('2024-01-20'),
          purchase_cost: 180000,
          warranty_expiry: new Date('2029-01-20'),
          vendor: vendors[0]?._id,
          department: 'IT'
        },
        {
          unique_asset_id: 'DSR-LAP-006',
          name: 'Dell XPS 15',
          asset_type: 'Laptop',
          manufacturer: 'Dell',
          model: 'XPS 15 9520',
          serial_number: 'DL-XPS-2024-006',
          status: 'Available',
          condition: 'Excellent',
          location: 'IT Department - Floor 3',
          purchase_date: new Date('2024-04-01'),
          purchase_cost: 95000,
          warranty_expiry: new Date('2027-04-01'),
          vendor: vendors[0]?._id,
          department: 'IT'
        },
        {
          unique_asset_id: 'DSR-PRN-007',
          name: 'HP LaserJet Pro',
          asset_type: 'Printer',
          manufacturer: 'HP',
          model: 'LaserJet Pro MFP M428fdw',
          serial_number: 'HP-LJ-2024-007',
          status: 'Active',
          condition: 'Good',
          location: 'Admin Office - Floor 2',
          purchase_date: new Date('2024-02-15'),
          purchase_cost: 35000,
          warranty_expiry: new Date('2026-02-15'),
          vendor: vendors[1]?._id,
          department: 'ADMIN'
        },
        {
          unique_asset_id: 'DSR-TAB-008',
          name: 'iPad Pro 12.9',
          asset_type: 'Tablet',
          manufacturer: 'Apple',
          model: 'iPad Pro 12.9" (6th Gen)',
          serial_number: 'APL-IPD-2024-008',
          status: 'Active',
          condition: 'Excellent',
          location: 'Inventory Department',
          purchase_date: new Date('2024-03-20'),
          purchase_cost: 85000,
          warranty_expiry: new Date('2025-03-20'),
          vendor: vendors[2]?._id,
          department: 'INVENTORY'
        },
        {
          unique_asset_id: 'DSR-MON-009',
          name: 'Dell UltraSharp 27"',
          asset_type: 'Monitor',
          manufacturer: 'Dell',
          model: 'U2723DE',
          serial_number: 'DL-MON-2024-009',
          status: 'Available',
          condition: 'Excellent',
          location: 'IT Department - Floor 3',
          purchase_date: new Date('2024-04-10'),
          purchase_cost: 32000,
          warranty_expiry: new Date('2027-04-10'),
          vendor: vendors[0]?._id,
          department: 'IT'
        },
        {
          unique_asset_id: 'DSR-LAP-010',
          name: 'HP ProBook 450',
          asset_type: 'Laptop',
          manufacturer: 'HP',
          model: 'ProBook 450 G9',
          serial_number: 'HP-PB-2023-010',
          status: 'Under Maintenance',
          condition: 'Fair',
          location: 'IT Department - Service Center',
          purchase_date: new Date('2023-06-10'),
          purchase_cost: 48000,
          warranty_expiry: new Date('2026-06-10'),
          vendor: vendors[1]?._id,
          department: 'IT'
        }
      ];

      const assets = await Asset.insertMany(assetData);
      results.assets = { created: assets.length };
      logger.info(`Created ${assets.length} assets`);
    } else {
      results.assets = { existing: assetCount };
    }

    // 4. Seed Maintenance Records
    let maintenanceCount = await Maintenance.countDocuments();
    if (maintenanceCount === 0) {
      const assets = await Asset.find().limit(3);
      
      const maintenanceData = [
        {
          asset_id: assets[0]?._id,
          maintenance_type: 'Preventive',
          maintenance_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'Scheduled',
          performed_by: adminUser.name,
          priority: 'Medium',
          cost: 5000,
          description: 'Regular quarterly maintenance check'
        },
        {
          asset_id: assets[1]?._id,
          maintenance_type: 'Corrective',
          maintenance_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          status: 'Scheduled',
          performed_by: adminUser.name,
          priority: 'High',
          cost: 8000,
          description: 'Hard drive replacement required'
        }
      ];

      if (assets.length >= 2) {
        const maintenanceRecords = await Maintenance.insertMany(maintenanceData);
        results.maintenance = { created: maintenanceRecords.length };
        logger.info(`Created ${maintenanceRecords.length} maintenance records`);
      }
    } else {
      results.maintenance = { existing: maintenanceCount };
    }

    logger.info('Database seeding completed', results);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: results
    });

  } catch (error) {
    logger.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed database',
      details: error.message
    });
  }
};

module.exports = {
  seedDatabase
};
