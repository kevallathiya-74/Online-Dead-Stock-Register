# 🌱 Database Seeding Scripts

This directory contains scripts to populate the database with sample data for testing and development.

## 📋 Available Scripts

### 1. Seed Users
```bash
npm run seed:users
```
Creates test users with different roles:
- Admin User
- Inventory Manager
- IT Manager
- Auditor
- Employees
- Vendor

### 2. Seed Assets
```bash
npm run seed:assets
```
Creates **10 diverse assets** across multiple categories:
- ✅ **Laptop** - Dell XPS 15 9530
- ✅ **Printer** - HP LaserJet Pro M404dn
- ✅ **Mobile Device** - Apple iPhone 14 Pro
- ✅ **Monitor** - LG 27UK850-W
- ✅ **Desktop Computer** - Lenovo ThinkCentre M720q
- ✅ **Network Switch** - Cisco Catalyst 2960-X
- ✅ **Office Furniture** - Herman Miller Aeron Chair
- ✅ **Camera** - Canon EOS R6 Mark II
- ✅ **UPS** - APC Smart-UPS 1500VA
- ✅ **Tablet** - Samsung Galaxy Tab S9 Ultra

**Total Asset Value:** ₹9,17,000

### 3. Seed All
```bash
npm run seed:all
```
Runs both user and asset seeding in sequence.

### 4. Verify Assets
```bash
npm run verify:assets
```
Displays a detailed report of all assets in the database including:
- Asset details (ID, manufacturer, model, type)
- Department distribution
- Status breakdown
- Condition analysis
- Assignment status
- Total asset value
- Statistics by category

## 📊 Asset Details

Each asset includes:
- ✅ **Unique Asset ID** - Sequential identifier (ASSET-2025-001, etc.)
- ✅ **Manufacturer** - Brand name (Dell, HP, Apple, etc.)
- ✅ **Model** - Specific model number
- ✅ **Serial Number** - Unique serial identifier
- ✅ **Asset Type** - Category classification
- ✅ **Location** - Physical location with floor and room details
- ✅ **Status** - Active, Available, Under Maintenance, etc.
- ✅ **Department** - IT, ADMIN, or INVENTORY
- ✅ **Purchase Date** - Acquisition date
- ✅ **Purchase Cost** - Value in Indian Rupees (₹)
- ✅ **Warranty Expiry** - Warranty end date
- ✅ **Last Audit Date** - Most recent audit timestamp
- ✅ **Condition** - Excellent, Good, Fair, or Poor
- ✅ **Configuration** - Technical specifications (JSON object)
- ✅ **Expected Lifespan** - Years of expected usage
- ✅ **Assigned User** - Randomly assigned to employees (50% probability)

## 🏢 Department Distribution

- **IT Department**: 5 assets (₹4,17,000)
- **ADMIN Department**: 3 assets (₹3,50,000)
- **INVENTORY Department**: 2 assets (₹1,50,000)

## 📦 Asset Categories

1. **Laptop** - High-performance workstation
2. **Printer** - Office printing device
3. **Mobile Device** - Smartphones
4. **Monitor** - Display screens
5. **Desktop Computer** - Workstation computers
6. **Network Switch** - Networking equipment
7. **Office Furniture** - Ergonomic chairs
8. **Camera** - Professional photography equipment
9. **UPS** - Uninterruptible Power Supply
10. **Tablet** - Mobile computing devices

## ⚙️ Configuration Examples

### Laptop Configuration
```json
{
  "processor": "Intel Core i7-13700H",
  "ram": "16GB DDR5",
  "storage": "512GB NVMe SSD",
  "display": "15.6\" FHD",
  "os": "Windows 11 Pro"
}
```

### Network Switch Configuration
```json
{
  "ports": "48 x 1GB Ethernet",
  "uplinks": "4 x 10GB SFP+",
  "poe": "PoE+ Supported",
  "capacity": "740W",
  "layer": "Layer 2/3"
}
```

## 🔄 Re-running Seeds

The scripts are **idempotent** - they check for existing entries and skip duplicates:
- ✅ Safe to run multiple times
- ⚠️ Existing assets are skipped (not overwritten)
- ✅ New assets are added
- ✅ Detailed logging shows created/skipped counts

## 📝 Notes

- Assets are automatically assigned to random users (50% probability)
- All monetary values are in Indian Rupees (₹)
- All dates include warranty expiry and audit dates
- Configuration objects contain detailed technical specifications
- Serial numbers follow manufacturer-specific patterns
- Asset IDs are sequential and unique

## 🚀 Quick Start

To set up a complete development environment:

```bash
# 1. Seed users first
npm run seed:users

# 2. Seed assets
npm run seed:assets

# 3. Verify the data
npm run verify:assets
```

Or use the combined command:
```bash
npm run seed:all
npm run verify:assets
```

## ✨ Features

- ✅ No mock data - all fields properly filled
- ✅ Realistic asset values and specifications
- ✅ Proper database field matching
- ✅ Error handling and validation
- ✅ Detailed logging and reporting
- ✅ Random user assignment for testing
- ✅ Multiple asset categories
- ✅ Complete configuration objects
- ✅ Valid warranty and audit dates
- ✅ Professional asset naming and IDs
