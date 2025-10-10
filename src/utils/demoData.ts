import { UserRole, Asset, AssetStatus, Vendor, MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../types';

// Demo Users with complete Auditor role
export const demoUsers = [
  {
    id: 'demo-user-1',
    username: 'System Administrator',
    email: 'admin@company.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    department: 'IT',
    employee_id: 'EMP001',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-2',
    username: 'Inventory Manager',
    email: 'inventory@company.com',
    password: 'Inventory@123',
    role: UserRole.INVENTORY_MANAGER,
    department: 'IT',
    employee_id: 'EMP002',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-3',
    username: 'John Employee',
    email: 'employee@company.com',
    password: 'Employee@123',
    role: UserRole.EMPLOYEE,
    department: 'IT',
    employee_id: 'EMP003',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-4',
    username: 'Audit Manager',
    email: 'auditor@company.com',
    password: 'Auditor@123',
    role: UserRole.AUDITOR,
    department: 'Audit',
    employee_id: 'EMP004',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Dynamic Asset Locations
export const locations = [
  'Main Office',
  'Warehouse A',
  'Warehouse B',
  'Branch Office 1',
  'Branch Office 2',
  'Storage Room',
  'Floor 1',
  'Floor 2',
  'Floor 3',
  'Reception'
];

// Dynamic Asset Categories
export const assetCategories = [
  'IT Equipment',
  'Office Equipment', 
  'Furniture',
  'Vehicles',
  'Machinery',
  'Building & Infrastructure'
];

// Dynamic Vendors Data
export const demoVendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Tech Solutions Ltd.',
    contactPerson: 'John Tech',
    email: 'john@techsolutions.com',
    phone: '+91-9876543210',
    address: 'Mumbai, Maharashtra',
    category: ['IT Equipment'],
    rating: 4.8,
    activeContracts: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vendor-2',
    name: 'Office Supplies Co.',
    contactPerson: 'Sarah Office',
    email: 'sarah@officesupplies.com',
    phone: '+91-9876543211',
    address: 'Delhi, Delhi',
    category: ['Office Equipment', 'Furniture'],
    rating: 4.6,
    activeContracts: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vendor-3',
    name: 'IT Equipment Inc.',
    contactPerson: 'Mike IT',
    email: 'mike@itequipment.com',
    phone: '+91-9876543212',
    address: 'Bangalore, Karnataka',
    category: ['IT Equipment'],
    rating: 4.9,
    activeContracts: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vendor-4',
    name: 'Maintenance Services',
    contactPerson: 'David Service',
    email: 'david@maintenance.com',
    phone: '+91-9876543213',
    address: 'Chennai, Tamil Nadu',
    category: ['Machinery', 'Building & Infrastructure'],
    rating: 4.5,
    activeContracts: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Function to generate random data within ranges
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

// Function to generate future date
const getFutureDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Function to generate past date
const getPastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Dynamic Asset Generation
export const generateDynamicAssets = (count: number = 500): Asset[] => {
  const assetNames = [
    'Dell XPS 15', 'MacBook Pro', 'HP Printer', 'Samsung Monitor', 'Lenovo ThinkPad',
    'Office Chair', 'Conference Table', 'Projector', 'Laptop Stand', 'Wireless Mouse',
    'Keyboard Set', 'UPS System', 'Router', 'Scanner', 'Whiteboard',
    'Filing Cabinet', 'Air Conditioner', 'Water Cooler', 'Coffee Machine', 'Shredder'
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `asset-${index + 1}`,
    name: `${randomChoice(assetNames)} ${index + 1}`,
    description: `High-quality ${randomChoice(assetNames).toLowerCase()} for office use`,
    category: randomChoice(assetCategories),
    status: randomChoice(Object.values(AssetStatus)),
    purchaseDate: getPastDate(randomBetween(30, 1000)),
    purchasePrice: randomBetween(5000, 150000),
    currentValue: randomBetween(2000, 100000),
    location: randomChoice(locations),
    department: randomChoice(['IT', 'HR', 'Finance', 'Operations', 'Admin']),
    assignedTo: Math.random() > 0.7 ? `user-${randomBetween(1, 20)}` : undefined,
    vendor: randomChoice(demoVendors).name,
    warrantyExpiry: Math.random() > 0.5 ? getFutureDate(randomBetween(30, 730)) : undefined,
    qrCode: `QR${String(index + 1).padStart(6, '0')}`,
    documents: [],
    maintenanceHistory: [],
    createdAt: getPastDate(randomBetween(1, 365)),
    updatedAt: new Date().toISOString(),
  }));
};

// Dynamic Maintenance Records
export const generateMaintenanceRecords = (assetCount: number): MaintenanceRecord[] => {
  return Array.from({ length: Math.floor(assetCount * 0.3) }, (_, index) => ({
    id: `maintenance-${index + 1}`,
    assetId: `asset-${randomBetween(1, assetCount)}`,
    type: randomChoice(Object.values(MaintenanceType)),
    description: `Scheduled ${randomChoice(['cleaning', 'repair', 'upgrade', 'inspection'])} service`,
    cost: randomBetween(500, 25000),
    vendor: randomChoice(demoVendors).name,
    startDate: Math.random() > 0.5 ? getPastDate(randomBetween(1, 90)) : getFutureDate(randomBetween(1, 30)),
    endDate: Math.random() > 0.7 ? getFutureDate(randomBetween(1, 7)) : undefined,
    status: randomChoice(Object.values(MaintenanceStatus)),
    notes: 'Regular maintenance as per schedule',
    documents: [],
    createdAt: getPastDate(randomBetween(1, 180)),
    updatedAt: new Date().toISOString(),
  }));
};

// Dynamic Dashboard Statistics Generator
export const generateInventoryStats = () => {
  const assets = JSON.parse(localStorage.getItem('demo_assets') || '[]');
  const totalAssets = assets.length;
  
  // Location distribution
  const locationStats = locations.reduce((acc, location) => {
    const count = assets.filter((asset: Asset) => asset.location === location).length;
    if (count > 0) {
      acc[location] = {
        count,
        percentage: Math.round((count / totalAssets) * 100)
      };
    }
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);

  // Status distribution
  const activeAssets = assets.filter((asset: Asset) => asset.status === AssetStatus.ACTIVE).length;
  const activePercentage = Math.round((activeAssets / totalAssets) * 100);

  // Warranty expiring calculation
  const currentDate = new Date();
  const warrantySoonCount = assets.filter((asset: Asset) => {
    if (!asset.warrantyExpiry) return false;
    const expiryDate = new Date(asset.warrantyExpiry);
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90; // Expiring within 90 days
  }).length;

  // Maintenance due calculation
  const maintenanceRecords = JSON.parse(localStorage.getItem('demo_maintenance') || '[]');
  const maintenanceDue = maintenanceRecords.filter((record: MaintenanceRecord) => 
    record.status === MaintenanceStatus.SCHEDULED
  ).length;

  // Purchase orders (simulated)
  const purchaseOrders = randomBetween(10, 25);

  return {
    totalAssets,
    locationStats,
    activePercentage,
    warrantySoonCount,
    maintenanceDue,
    purchaseOrders,
    locations: Object.keys(locationStats).length,
    trendData: {
      assets: randomBetween(-5, 15),
      purchases: randomBetween(10, 40),
    }
  };
};

// Dynamic Warranty Expiring Data
export const getWarrantyExpiringAssets = () => {
  const assets = JSON.parse(localStorage.getItem('demo_assets') || '[]');
  const currentDate = new Date();
  
  return assets
    .filter((asset: Asset) => {
      if (!asset.warrantyExpiry) return false;
      const expiryDate = new Date(asset.warrantyExpiry);
      const diffTime = expiryDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 120; // Next 4 months
    })
    .map((asset: Asset) => {
      const expiryDate = new Date(asset.warrantyExpiry!);
      const diffTime = expiryDate.getTime() - currentDate.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        asset: asset.name,
        category: asset.category,
        expiryDate: asset.warrantyExpiry,
        daysLeft,
        priority: daysLeft <= 30 ? 'high' : daysLeft <= 60 ? 'medium' : 'low'
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10); // Top 10 expiring
};

// Dynamic Maintenance Schedule
export const getMaintenanceSchedule = () => {
  const maintenanceRecords = JSON.parse(localStorage.getItem('demo_maintenance') || '[]');
  
  return maintenanceRecords
    .filter((record: MaintenanceRecord) => 
      record.status === MaintenanceStatus.SCHEDULED || 
      record.status === MaintenanceStatus.IN_PROGRESS
    )
    .map((record: MaintenanceRecord) => ({
      asset: record.description.replace('Scheduled ', '').replace(' service', ''),
      type: record.type,
      scheduledDate: record.startDate,
      technician: record.vendor,
      status: record.status.toLowerCase()
    }))
    .slice(0, 5); // Next 5 maintenance items
};

// Dynamic Vendor Performance Data
export const getVendorPerformance = () => {
  return demoVendors
    .map(vendor => ({
      name: vendor.name,
      orders: vendor.activeContracts,
      value: `₹${(vendor.activeContracts * randomBetween(15000, 50000)).toLocaleString()}`,
      rating: vendor.rating
    }))
    .sort((a, b) => b.orders - a.orders);
};

// Enhanced initialization function
export const initializeDemoData = () => {
  try {
    // Force refresh demo users to ensure they match current structure (from main)
    localStorage.setItem('demo_users', JSON.stringify(demoUsers));
    console.log('✅ Demo users initialized/refreshed:', demoUsers.length, 'users');
    
    // Log each user for debugging
    demoUsers.forEach((user, index) => {
      console.log(`Demo user ${index + 1}:`, user.email, '-', user.role);
    });

    // Initialize assets
    const existingAssets = localStorage.getItem('demo_assets');
    if (!existingAssets) {
      const assets = generateDynamicAssets(randomBetween(400, 600));
      localStorage.setItem('demo_assets', JSON.stringify(assets));
      console.log('✅ Demo assets initialized:', assets.length, 'assets');
    }

    // Initialize maintenance records
    const existingMaintenance = localStorage.getItem('demo_maintenance');
    if (!existingMaintenance) {
      const maintenance = generateMaintenanceRecords(500);
      localStorage.setItem('demo_maintenance', JSON.stringify(maintenance));
      console.log('✅ Demo maintenance records initialized:', maintenance.length, 'records');
    }

    // Initialize vendors
    const existingVendors = localStorage.getItem('demo_vendors');
    if (!existingVendors) {
      localStorage.setItem('demo_vendors', JSON.stringify(demoVendors));
      console.log('✅ Demo vendors initialized');
    }

    // Force refresh data every hour to keep it dynamic
    const lastRefresh = localStorage.getItem('demo_last_refresh');
    const currentTime = Date.now();
    
    if (!lastRefresh || (currentTime - parseInt(lastRefresh)) > 3600000) { // 1 hour
      // Refresh some data to keep it dynamic
      const assets = JSON.parse(localStorage.getItem('demo_assets') || '[]');
      
      // Update some asset statuses randomly
      assets.forEach((asset: Asset, index: number) => {
        if (Math.random() < 0.1) { // 10% chance to update
          asset.status = randomChoice(Object.values(AssetStatus));
          asset.location = randomChoice(locations);
          asset.updatedAt = new Date().toISOString();
        }
      });
      
      localStorage.setItem('demo_assets', JSON.stringify(assets));
      localStorage.setItem('demo_last_refresh', currentTime.toString());
      console.log('🔄 Demo data refreshed to keep it dynamic');
    }

  } catch (error) {
    console.error('❌ Error initializing demo data:', error);
  }
};