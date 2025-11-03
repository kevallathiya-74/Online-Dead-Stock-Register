const mongoose = require("mongoose");
const Asset = require("../models/asset");
const User = require("../models/user");
const Vendor = require("../models/vendor");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const generateAssetId = (index) => {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(3, "0");
  return `ASSET-${year}-${paddedIndex}`;
};

const calculateWarrantyExpiry = (purchaseDate, years) => {
  const expiry = new Date(purchaseDate);
  expiry.setFullYear(expiry.getFullYear() + years);
  return expiry;
};

const randomPastDate = (monthsAgo) => {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsAgo));
  return date;
};

const seedAssets = async () => {
  try {
    await connectDB();

    const users = await User.find({}).limit(10);
    const vendors = await Vendor.find({}).limit(10);

    const existingAssets = await Asset.find({}).sort({ unique_asset_id: -1 }).limit(1);
    let startIndex = 10;
    if (existingAssets.length > 0) {
      const lastId = existingAssets[0].unique_asset_id;
      const match = lastId.match(/ASSET-\d+-(\d+)/);
      if (match) {
        startIndex = parseInt(match[1]) + 1;
      }
    }

    console.log(`Starting asset creation from index ${startIndex}...`);

    const assetsData = [
      {
        name: "Dell OptiPlex 7090 Desktop",
        manufacturer: "Dell",
        model: "OptiPlex 7090",
        asset_type: "Computer",
        location: "IT Department - Floor 3, Room 301",
        status: "Active",
        department: "IT",
        purchase_cost: 103750.00,
        warranty_years: 3,
        condition: "Excellent",
        notes: "High-performance desktop for development team",
        expected_lifespan: 5
      },
      {
        name: "HP LaserJet Pro M404dn Printer",
        manufacturer: "HP",
        model: "LaserJet Pro M404dn",
        asset_type: "Printer",
        location: "Admin Office - Floor 2, Room 205",
        status: "Available",
        department: "ADMIN",
        purchase_cost: 37350.00,
        warranty_years: 2,
        condition: "Good",
        notes: "Network printer for administrative documents",
        expected_lifespan: 7
      },
      {
        name: "Lenovo ThinkPad T14 Laptop",
        manufacturer: "Lenovo",
        model: "ThinkPad T14 Gen 2",
        asset_type: "Laptop",
        location: "Inventory - Floor 1, Storage A",
        status: "Available",
        department: "INVENTORY",
        purchase_cost: 120350.00,
        warranty_years: 3,
        condition: "Excellent",
        notes: "Portable workstation for field inventory audits",
        expected_lifespan: 5
      },
      {
        name: "APC Smart-UPS 1500VA",
        manufacturer: "APC by Schneider Electric",
        model: "SMT1500",
        asset_type: "UPS",
        location: "IT Server Room - Floor 3, Room 350",
        status: "Active",
        department: "IT",
        purchase_cost: 53950.00,
        warranty_years: 3,
        condition: "Good",
        notes: "Provides backup power to critical server infrastructure",
        expected_lifespan: 10
      },
      {
        name: "Cisco Catalyst 2960-X Switch",
        manufacturer: "Cisco",
        model: "WS-C2960X-48FPD-L",
        asset_type: "Network Equipment",
        location: "IT Network Closet - Floor 2, Room 250",
        status: "Active",
        department: "IT",
        purchase_cost: 265600.00,
        warranty_years: 5,
        condition: "Excellent",
        notes: "48-port managed PoE+ switch for office network",
        expected_lifespan: 10
      },
      {
        name: "Samsung 65 inch 4K Display",
        manufacturer: "Samsung",
        model: "QM65R",
        asset_type: "Display",
        location: "Conference Room - Floor 4, Room 401",
        status: "Active",
        department: "ADMIN",
        purchase_cost: 149400.00,
        warranty_years: 3,
        condition: "Excellent",
        notes: "Large format display for presentations",
        expected_lifespan: 8
      },
      {
        name: "Synology DS920+ NAS",
        manufacturer: "Synology",
        model: "DiskStation DS920+",
        asset_type: "Storage",
        location: "IT Server Room - Floor 3, Rack B",
        status: "Active",
        department: "IT",
        purchase_cost: 45650.00,
        warranty_years: 2,
        condition: "Excellent",
        notes: "Network-attached storage for backup",
        expected_lifespan: 8
      },
      {
        name: "Brother Label Printer QL-820NWB",
        manufacturer: "Brother",
        model: "QL-820NWB",
        asset_type: "Label Printer",
        location: "Inventory - Floor 1, Workstation 5",
        status: "Active",
        department: "INVENTORY",
        purchase_cost: 23240.00,
        warranty_years: 2,
        condition: "Good",
        notes: "Used for printing asset labels",
        expected_lifespan: 5
      },
      {
        name: "Fujitsu ScanSnap iX1600",
        manufacturer: "Fujitsu",
        model: "ScanSnap iX1600",
        asset_type: "Scanner",
        location: "Admin Office - Floor 2, Room 210",
        status: "Under Maintenance",
        department: "ADMIN",
        purchase_cost: 41085.00,
        warranty_years: 1,
        last_maintenance_date: new Date(),
        condition: "Fair",
        notes: "Document scanner for digitizing records",
        expected_lifespan: 6
      },
      {
        name: "Apple Mac Mini M2",
        manufacturer: "Apple",
        model: "Mac Mini M2 2023",
        asset_type: "Computer",
        location: "IT Department - Floor 3, Room 305",
        status: "Available",
        department: "IT",
        purchase_cost: 82917.00,
        warranty_years: 1,
        condition: "Excellent",
        notes: "Compact desktop for macOS development",
        expected_lifespan: 5
      }
    ];

    const createdAssets = [];

    for (let i = 0; i < assetsData.length; i++) {
      const assetData = assetsData[i];
      assetData.unique_asset_id = generateAssetId(startIndex + i);
      assetData.serial_number = `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      assetData.purchase_date = randomPastDate(24);
      assetData.warranty_expiry = calculateWarrantyExpiry(assetData.purchase_date, assetData.warranty_years);
      delete assetData.warranty_years;
      
      if (users.length > 0 && assetData.status === "Active") {
        assetData.assigned_user = users[Math.floor(Math.random() * users.length)]._id;
      }
      
      if (vendors.length > 0) {
        assetData.vendor = vendors[Math.floor(Math.random() * vendors.length)]._id;
      }
      
      if (assetData.status === "Active") {
        assetData.last_audit_date = randomPastDate(3);
      }

      const asset = new Asset(assetData);
      await asset.save();
      
      createdAssets.push({
        id: asset.unique_asset_id,
        name: asset.name,
        type: asset.asset_type,
        status: asset.status
      });

      console.log(`Created: ${asset.unique_asset_id} - ${asset.name}`);
    }

    console.log(`Successfully created ${createdAssets.length} assets!`);
    return createdAssets;

  } catch (error) {
    console.error("Error seeding assets:", error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  seedAssets().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
}

module.exports = seedAssets;
