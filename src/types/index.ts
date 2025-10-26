// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department: Department;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
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
  id: string;
  name: string;
  description: string;
  category: string;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  location: string;
  department: string;
  assignedTo?: string;
  vendor: string;
  warrantyExpiry?: string;
  qrCode: string;
  documents: string[];
  maintenanceHistory: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  DISPOSED = 'DISPOSED',
  SCRAPPED = 'SCRAPPED'
}

// Maintenance Types
export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  vendor: string;
  startDate: string;
  endDate?: string;
  status: MaintenanceStatus;
  notes: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  UPGRADE = 'UPGRADE'
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Approval Types
export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  status: ApprovalStatus;
  description: string;
  documents: string[];
  comments: ApprovalComment[];
  createdAt: string;
  updatedAt: string;
}

export enum ApprovalType {
  PURCHASE = 'PURCHASE',
  DISPOSAL = 'DISPOSAL',
  MAINTENANCE = 'MAINTENANCE',
  TRANSFER = 'TRANSFER'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
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
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string[];
  rating: number;
  activeContracts: number;
  createdAt: string;
  updatedAt: string;
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
  totalRevenue: string;
  currency: string;
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
  currency: string;
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
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  warranty_expiry?: string;
  assigned_to: {
    name: string;
    email: string;
    department: string;
  } | null;
  location: any;
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