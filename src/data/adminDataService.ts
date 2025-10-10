// Admin Data Service - Provides dynamic data for all admin pages
import { addDays, subDays, format } from 'date-fns';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Inventory_Manager' | 'Auditor' | 'Employee';
  department: string;
  employee_id: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  avatar?: string;
  phone?: string;
  location?: string;
  manager?: string;
  permissions: string[];
}

export interface AdminAsset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_type: string;
  location: string;
  assigned_user?: AdminUser;
  status: 'Active' | 'Under Maintenance' | 'Available' | 'Damaged' | 'Ready for Scrap';
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry: string;
  last_audit_date: string;
  condition: string;
  configuration?: any;
  expected_lifespan: number;
  qr_code?: string;
  vendor?: string;
  depreciation_rate?: number;
  current_value?: number;
}

export interface AdminTransaction {
  id: string;
  asset: AdminAsset;
  transaction_type: 'Asset Assignment' | 'Asset Transfer' | 'Check-out' | 'Check-in' | 'Maintenance' | 'Return';
  from_user?: AdminUser;
  to_user?: AdminUser;
  from_location?: string;
  to_location?: string;
  quantity: number;
  notes?: string;
  transaction_date: string;
  approved_by?: AdminUser;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimated_completion?: string;
}

export interface AdminAuditLog {
  id: string;
  user: AdminUser;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  description: string;
}

export interface AdminVendor {
  id: string;
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_terms: string;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_value: number;
  last_order_date?: string;
  rating: number;
}

export interface AdminMaintenance {
  id: string;
  asset: AdminAsset;
  maintenance_type: 'Preventive' | 'Corrective' | 'Emergency' | 'Upgrade';
  description: string;
  scheduled_date: string;
  completion_date?: string;
  cost: number;
  vendor?: AdminVendor;
  technician: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  parts_used?: string[];
  downtime_hours?: number;
}

// Data generation functions
class AdminDataService {
  private static users: AdminUser[] = [];
  private static assets: AdminAsset[] = [];
  private static transactions: AdminTransaction[] = [];
  private static auditLogs: AdminAuditLog[] = [];
  private static vendors: AdminVendor[] = [];
  private static maintenance: AdminMaintenance[] = [];

  static generateUsers(): AdminUser[] {
    if (this.users.length > 0) return this.users;

    const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 'Security', 'Facilities'];
    const roles: AdminUser['role'][] = ['Admin', 'Inventory_Manager', 'Auditor', 'Employee'];
    const locations = ['New York', 'San Francisco', 'Chicago', 'Austin', 'Boston', 'Seattle', 'Denver', 'Atlanta'];

    const names = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
      'Jessica Miller', 'Christopher Moore', 'Ashley Taylor', 'Matthew Anderson', 'Amanda Thomas',
      'James Jackson', 'Jennifer White', 'Robert Harris', 'Lisa Martin', 'William Thompson',
      'Karen Garcia', 'Joseph Martinez', 'Nancy Robinson', 'Daniel Clark', 'Betty Lewis',
      'Mark Lee', 'Helen Walker', 'Paul Hall', 'Sandra Allen', 'Steven Young',
      'Donna Hernandez', 'Kenneth King', 'Carol Wright', 'Joshua Lopez', 'Ruth Hill'
    ];

    this.users = names.map((name, index) => ({
      id: `user_${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
      role: roles[Math.floor(Math.random() * roles.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      employee_id: `EMP${String(index + 1001).padStart(4, '0')}`,
      is_active: Math.random() > 0.1,
      created_at: format(subDays(new Date(), Math.floor(Math.random() * 365)), 'yyyy-MM-dd'),
      last_login: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm:ss'),
      phone: `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      manager: index > 5 ? names[Math.floor(Math.random() * 5)] : undefined,
      permissions: this.generatePermissions(roles[Math.floor(Math.random() * roles.length)])
    }));

    return this.users;
  }

  static generateAssets(): AdminAsset[] {
    if (this.assets.length > 0) return this.assets;

    const manufacturers = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Cisco', 'IBM', 'Canon', 'Xerox'];
    const assetTypes = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Scanner', 'Server', 'Router', 'Switch', 'Phone'];
    const statuses: AdminAsset['status'][] = ['Active', 'Under Maintenance', 'Available', 'Damaged', 'Ready for Scrap'];
    const locations = ['Floor 1', 'Floor 2', 'Floor 3', 'Warehouse', 'Data Center', 'Conference Room A', 'Conference Room B'];
    const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];

    const users = this.generateUsers();

    this.assets = Array.from({ length: 150 }, (_, index) => {
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const purchaseDate = subDays(new Date(), Math.floor(Math.random() * 1095)); // Up to 3 years ago
      const cost = Math.floor(Math.random() * 5000) + 500;
      
      return {
        id: `asset_${index + 1}`,
        unique_asset_id: `AST-${String(index + 10001).padStart(5, '0')}`,
        manufacturer,
        model: `${manufacturer}-${assetType}-${Math.floor(Math.random() * 1000)}`,
        serial_number: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        asset_type: assetType,
        location: locations[Math.floor(Math.random() * locations.length)],
        assigned_user: Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
        purchase_cost: cost,
        warranty_expiry: format(addDays(purchaseDate, Math.floor(Math.random() * 1095) + 365), 'yyyy-MM-dd'),
        last_audit_date: format(subDays(new Date(), Math.floor(Math.random() * 90)), 'yyyy-MM-dd'),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        expected_lifespan: Math.floor(Math.random() * 5) + 3,
        qr_code: `QR-${index + 10001}`,
        vendor: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        depreciation_rate: Math.floor(Math.random() * 20) + 10,
        current_value: Math.floor(cost * (0.9 - Math.random() * 0.5))
      };
    });

    return this.assets;
  }

  static generateTransactions(): AdminTransaction[] {
    if (this.transactions.length > 0) return this.transactions;

    const transactionTypes: AdminTransaction['transaction_type'][] = [
      'Asset Assignment', 'Asset Transfer', 'Check-out', 'Check-in', 'Maintenance', 'Return'
    ];
    const statuses: AdminTransaction['status'][] = ['Pending', 'Approved', 'Completed', 'Rejected'];
    const priorities: AdminTransaction['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

    const users = this.generateUsers();
    const assets = this.generateAssets();

    this.transactions = Array.from({ length: 200 }, (_, index) => {
      const transactionDate = subDays(new Date(), Math.floor(Math.random() * 90));
      
      return {
        id: `txn_${index + 1}`,
        asset: assets[Math.floor(Math.random() * assets.length)],
        transaction_type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        from_user: Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined,
        to_user: Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined,
        from_location: Math.random() > 0.5 ? 'Floor 1' : 'Floor 2',
        to_location: Math.random() > 0.5 ? 'Floor 3' : 'Warehouse',
        quantity: 1,
        notes: Math.random() > 0.7 ? 'Urgent request from department head' : undefined,
        transaction_date: format(transactionDate, 'yyyy-MM-dd HH:mm:ss'),
        approved_by: Math.random() > 0.4 ? users[Math.floor(Math.random() * 5)] : undefined,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        estimated_completion: Math.random() > 0.6 ? format(addDays(transactionDate, Math.floor(Math.random() * 7) + 1), 'yyyy-MM-dd') : undefined
      };
    });

    return this.transactions;
  }

  static generateAuditLogs(): AdminAuditLog[] {
    if (this.auditLogs.length > 0) return this.auditLogs;

    const actions = [
      'User Login', 'User Logout', 'Asset Created', 'Asset Updated', 'Asset Deleted',
      'Transaction Created', 'Transaction Approved', 'User Created', 'User Updated',
      'Password Changed', 'Role Modified', 'Asset Assigned', 'Asset Transferred',
      'Maintenance Scheduled', 'Report Generated', 'Backup Created', 'Settings Modified'
    ];

    const entityTypes = ['User', 'Asset', 'Transaction', 'Vendor', 'Maintenance', 'System'];
    const severities: AdminAuditLog['severity'][] = ['Info', 'Warning', 'Error', 'Critical'];
    const ipAddresses = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.25'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];

    const users = this.generateUsers();

    this.auditLogs = Array.from({ length: 500 }, (_, index) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        id: `audit_${index + 1}`,
        user: users[Math.floor(Math.random() * users.length)],
        action,
        entity_type: entityTypes[Math.floor(Math.random() * entityTypes.length)],
        entity_id: `entity_${Math.floor(Math.random() * 1000)}`,
        old_values: Math.random() > 0.7 ? { status: 'Available' } : undefined,
        new_values: Math.random() > 0.7 ? { status: 'Active' } : undefined,
        ip_address: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        timestamp: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm:ss'),
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `${action} performed on ${entityTypes[Math.floor(Math.random() * entityTypes.length)]}`
      };
    });

    return this.auditLogs;
  }

  static generateVendors(): AdminVendor[] {
    if (this.vendors.length > 0) return this.vendors;

    const vendorNames = [
      'TechSupply Co.', 'Office Solutions Inc.', 'Digital Hardware Ltd.', 'Corporate Equipment',
      'Business Tech Partners', 'Enterprise Solutions', 'IT Services Group', 'Hardware Direct',
      'System Components Corp.', 'Professional Equipment', 'Technology Resources', 'Equipment Express',
      'Digital Solutions Hub', 'Corporate Tech Supply', 'Business Hardware Co.'
    ];

    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];
    
    this.vendors = vendorNames.map((name, index) => ({
      id: `vendor_${index + 1}`,
      vendor_name: name,
      contact_person: `Contact Person ${index + 1}`,
      email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      address: {
        street: `${Math.floor(Math.random() * 9999)} ${['Main', 'Oak', 'Pine', 'First', 'Second'][Math.floor(Math.random() * 5)]} St`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: states[Math.floor(Math.random() * states.length)],
        zip_code: String(Math.floor(Math.random() * 90000) + 10000),
        country: 'USA'
      },
      payment_terms: ['Net 30', 'Net 60', '2/10 Net 30', 'Cash on Delivery'][Math.floor(Math.random() * 4)],
      is_active: Math.random() > 0.1,
      created_at: format(subDays(new Date(), Math.floor(Math.random() * 365)), 'yyyy-MM-dd'),
      total_orders: Math.floor(Math.random() * 50) + 1,
      total_value: Math.floor(Math.random() * 500000) + 10000,
      last_order_date: Math.random() > 0.3 ? format(subDays(new Date(), Math.floor(Math.random() * 90)), 'yyyy-MM-dd') : undefined,
      rating: Math.floor(Math.random() * 5) + 1
    }));

    return this.vendors;
  }

  static generateMaintenance(): AdminMaintenance[] {
    if (this.maintenance.length > 0) return this.maintenance;

    const maintenanceTypes: AdminMaintenance['maintenance_type'][] = ['Preventive', 'Corrective', 'Emergency', 'Upgrade'];
    const statuses: AdminMaintenance['status'][] = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    const priorities: AdminMaintenance['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
    const technicians = ['John Tech', 'Sarah Repair', 'Mike Fix', 'Lisa Service', 'Dave Maintain'];

    const assets = this.generateAssets();
    const vendors = this.generateVendors();

    this.maintenance = Array.from({ length: 80 }, (_, index) => {
      const scheduledDate = addDays(new Date(), Math.floor(Math.random() * 60) - 30);
      const isCompleted = Math.random() > 0.4;
      
      return {
        id: `maint_${index + 1}`,
        asset: assets[Math.floor(Math.random() * assets.length)],
        maintenance_type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
        description: `${maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)]} maintenance for ${assets[Math.floor(Math.random() * assets.length)].asset_type}`,
        scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
        completion_date: isCompleted ? format(addDays(scheduledDate, Math.floor(Math.random() * 5)), 'yyyy-MM-dd') : undefined,
        cost: Math.floor(Math.random() * 2000) + 100,
        vendor: Math.random() > 0.5 ? vendors[Math.floor(Math.random() * vendors.length)] : undefined,
        technician: technicians[Math.floor(Math.random() * technicians.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        parts_used: Math.random() > 0.6 ? ['CPU Fan', 'Memory Module', 'Hard Drive'] : undefined,
        downtime_hours: Math.random() > 0.5 ? Math.floor(Math.random() * 24) + 1 : undefined
      };
    });

    return this.maintenance;
  }

  private static generatePermissions(role: AdminUser['role']): string[] {
    const allPermissions = [
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_assets', 'create_assets', 'edit_assets', 'delete_assets',
      'view_transactions', 'approve_transactions', 'create_transactions',
      'view_reports', 'create_reports', 'export_data',
      'view_audit_logs', 'view_system_settings', 'edit_system_settings',
      'manage_vendors', 'schedule_maintenance', 'approve_maintenance'
    ];

    switch (role) {
      case 'Admin':
        return allPermissions;
      case 'Inventory_Manager':
        return [
          'view_users', 'view_assets', 'create_assets', 'edit_assets',
          'view_transactions', 'create_transactions', 'approve_transactions',
          'view_reports', 'create_reports', 'manage_vendors', 'schedule_maintenance'
        ];
      case 'Auditor':
        return [
          'view_users', 'view_assets', 'view_transactions', 'view_reports',
          'create_reports', 'export_data', 'view_audit_logs'
        ];
      case 'Employee':
        return ['view_assets', 'view_transactions'];
      default:
        return [];
    }
  }

  // Public getter methods
  static getUsers(): AdminUser[] {
    return this.generateUsers();
  }

  static getAssets(): AdminAsset[] {
    return this.generateAssets();
  }

  static getTransactions(): AdminTransaction[] {
    return this.generateTransactions();
  }

  static getAuditLogs(): AdminAuditLog[] {
    return this.generateAuditLogs();
  }

  static getVendors(): AdminVendor[] {
    return this.generateVendors();
  }

  static getMaintenance(): AdminMaintenance[] {
    return this.generateMaintenance();
  }

  // Statistics methods
  static getUserStatistics() {
    const users = this.getUsers();
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentStats = users.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      byRole: roleStats,
      byDepartment: departmentStats,
      recentLogins: users.filter(u => new Date(u.last_login) > subDays(new Date(), 7)).length
    };
  }

  static getAssetStatistics() {
    const assets = this.getAssets();
    const statusStats = assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = assets.reduce((acc, asset) => {
      acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: assets.length,
      assigned: assets.filter(a => a.assigned_user).length,
      available: assets.filter(a => a.status === 'Available').length,
      underMaintenance: assets.filter(a => a.status === 'Under Maintenance').length,
      byStatus: statusStats,
      byType: typeStats,
      totalValue: assets.reduce((sum, asset) => sum + asset.purchase_cost, 0),
      currentValue: assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0)
    };
  }

  static getTransactionStatistics() {
    const transactions = this.getTransactions();
    const statusStats = transactions.reduce((acc, txn) => {
      acc[txn.status] = (acc[txn.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = transactions.reduce((acc, txn) => {
      acc[txn.transaction_type] = (acc[txn.transaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'Pending').length,
      approved: transactions.filter(t => t.status === 'Approved').length,
      completed: transactions.filter(t => t.status === 'Completed').length,
      byStatus: statusStats,
      byType: typeStats,
      recentTransactions: transactions.filter(t => new Date(t.transaction_date) > subDays(new Date(), 7)).length
    };
  }

  // Search and filter methods
  static searchUsers(query: string): AdminUser[] {
    const users = this.getUsers();
    const lowercaseQuery = query.toLowerCase();
    
    return users.filter(user =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.employee_id.toLowerCase().includes(lowercaseQuery) ||
      user.department.toLowerCase().includes(lowercaseQuery)
    );
  }

  static searchAssets(query: string): AdminAsset[] {
    const assets = this.getAssets();
    const lowercaseQuery = query.toLowerCase();
    
    return assets.filter(asset =>
      asset.unique_asset_id.toLowerCase().includes(lowercaseQuery) ||
      asset.manufacturer.toLowerCase().includes(lowercaseQuery) ||
      asset.model.toLowerCase().includes(lowercaseQuery) ||
      asset.serial_number.toLowerCase().includes(lowercaseQuery) ||
      asset.asset_type.toLowerCase().includes(lowercaseQuery) ||
      asset.location.toLowerCase().includes(lowercaseQuery)
    );
  }

  static searchTransactions(query: string): AdminTransaction[] {
    const transactions = this.getTransactions();
    const lowercaseQuery = query.toLowerCase();
    
    return transactions.filter(txn =>
      txn.asset.unique_asset_id.toLowerCase().includes(lowercaseQuery) ||
      txn.transaction_type.toLowerCase().includes(lowercaseQuery) ||
      txn.from_user?.name.toLowerCase().includes(lowercaseQuery) ||
      txn.to_user?.name.toLowerCase().includes(lowercaseQuery) ||
      txn.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export default AdminDataService;