// User Types
export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  employee_id?: string;
  vendor_id?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  IT_MANAGER = 'IT_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  AUDITOR = 'AUDITOR',
  VENDOR = 'VENDOR'
}

export enum Department {
  INVENTORY = 'INVENTORY',
  IT = 'IT',
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR'
}

// Asset Types
export interface Asset {
  _id?: string;
  id?: string;
  unique_asset_id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_type: string;
  location: string;
  assigned_user?: string | { _id: string; name: string; email: string };
  status: AssetStatus;
  department: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry?: string;
  last_audit_date?: string;
  last_audited_by?: string;
  condition: string;
  notes?: string;
  vendor?: string | { _id: string; vendor_name: string };
  images?: string[];
  last_maintenance_date?: string;
  configuration?: any;
  expected_lifespan?: number;
  createdAt?: string;
  updatedAt?: string;
}

export enum AssetStatus {
  ACTIVE = 'Active',
  AVAILABLE = 'Available',
  UNDER_MAINTENANCE = 'Under Maintenance',
  DAMAGED = 'Damaged',
  READY_FOR_SCRAP = 'Ready for Scrap',
  DISPOSED = 'Disposed'
}

// Maintenance Types
export interface MaintenanceRecord {
  _id?: string;
  id?: string;
  asset_id: string | { _id: string; unique_asset_id: string };
  maintenance_type: MaintenanceType;
  description: string;
  cost: number;
  vendor_id?: string | { _id: string; vendor_name: string };
  maintenance_date: string;
  next_maintenance_date?: string;
  performed_by?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: MaintenanceStatus;
  estimated_duration?: number;
  actual_duration?: number;
  downtime_impact?: 'Low' | 'Medium' | 'High';
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum MaintenanceType {
  PREVENTIVE = 'Preventive',
  CORRECTIVE = 'Corrective',
  PREDICTIVE = 'Predictive',
  EMERGENCY = 'Emergency',
  INSPECTION = 'Inspection',
  CALIBRATION = 'Calibration',
  CLEANING = 'Cleaning'
}

export enum MaintenanceStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

// Approval Types
export interface ApprovalRequest {
  _id?: string;
  id?: string;
  request_type: ApprovalType;
  asset_id?: string | { _id: string; unique_asset_id: string };
  requested_by: string | { _id: string; name: string; email: string };
  approver?: string | { _id: string; name: string; email: string };
  status: ApprovalStatus;
  request_data?: any;
  comments?: string;
  created_at?: string;
  approved_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum ApprovalType {
  REPAIR = 'Repair',
  UPGRADE = 'Upgrade',
  SCRAP = 'Scrap',
  NEW_ASSET = 'New Asset',
  OTHER = 'Other'
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected'
}

export interface ApprovalComment {
  id: string;
  userId: string;
  comment: string;
  createdAt: string;
}

// Document Types
export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  description: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  WARRANTY = 'WARRANTY',
  MAINTENANCE = 'MAINTENANCE',
  DISPOSAL = 'DISPOSAL',
  OTHER = 'OTHER'
}

// Vendor Types
export interface Vendor {
  _id?: string;
  id?: string;
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  payment_terms?: string;
  is_active: boolean;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Location {
  building?: string;
  floor?: string;
  room?: string;
  department?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Auditor Types
export interface AuditorStats {
  total_assigned: number;
  completed: number;
  pending: number;
  discrepancies: number;
  missing: number;
  completion_rate: number;
}

export interface AuditItem {
  id: string;
  asset_id: string;
  asset_name: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  status: 'verified' | 'pending' | 'discrepancy' | 'missing';
  condition: string;
  notes?: string;
}

export interface AuditActivity {
  id: string;
  type: 'audit_completed' | 'asset_missing' | 'discrepancy_found' | 'compliance_check';
  title: string;
  description: string;
  timestamp: string;
  asset_id: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceMetrics {
  overallScore: number;
  categoryScores: {
    [key: string]: number;
  };
  trends: Array<{
    date: string;
    score: number;
  }>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Vendor Portal Types
export interface VendorStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingInvoices: number;
  onTimeDeliveryRate: number;
  performanceScore: number;
}

export interface VendorOrder {
  _id: string;
  po_number: string;
  status: string;
  priority: string;
  total_amount: number;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  order_date: string;
  items_count: number;
  requested_by: {
    name: string;
    email: string;
    department: string;
  } | null;
  approved_by: {
    name: string;
    email: string;
  } | null;
  payment_terms?: string;
  payment_method?: string;
}

export interface VendorProduct {
  _id: string;
  asset_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  condition: string;
  purchase_cost: number;
  current_value: number;
  purchase_date: string;
  warranty_expiry?: string;
  assigned_to: {
    name: string;
    email: string;
    department: string;
  } | null;
  location: Location | null;
  quantity: number;
  serial_number?: string;
  model_number?: string;
}

export interface VendorInvoice {
  _id: string;
  invoice_number: string;
  order_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_method: string;
  payment_terms: string;
  items_count: number;
  requested_by: string;
}

export interface VendorProfile {
  _id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  category: string[];
  gst_number?: string;
  pan_number?: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
  };
  rating?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  performance?: {
    total_orders: number;
    on_time_delivery_rate: number;
    rating: number;
  };
}