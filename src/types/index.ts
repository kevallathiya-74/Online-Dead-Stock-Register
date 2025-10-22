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
  EMPLOYEE = 'EMPLOYEE'
}

export enum Department {
  INVENTORY = 'INVENTORY',
  IT = 'IT',
  ADMIN = 'ADMIN'
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