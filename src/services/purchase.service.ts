import api from './api';
import { ApiResponse, Pagination } from '../types';

// Purchase Management Service
export interface VendorInfo {
  id: string;
  name: string;
  vendor_code: string;
  contact_person: string;
  contact_email: string;
}

export interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  value: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
  count: number;
}

export interface TopVendor {
  vendor_id: string;
  vendor_name: string;
  total_spent: number;
  order_count: number;
}

export interface PurchaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vendor?: string;
  department?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetPurchaseOrdersResponse {
  purchase_orders: PurchaseOrder[];
  pagination: Pagination;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor: VendorInfo;
  items: PurchaseOrderItem[];
  status: 'pending' | 'approved' | 'sent' | 'partially_received' | 'completed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  requested_by: UserInfo;
  approved_by?: UserInfo;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_delivery_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications?: string;
  category?: string;
}

export interface PurchaseRequest {
  id: string;
  request_number: string;
  requester: UserInfo;
  items: PurchaseRequestItem[];
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'converted_to_po';
  department: string;
  purpose: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  total_estimated_cost: number;
  preferred_vendors?: string[];
  justification: string;
  budget_code?: string;
  expected_delivery_date: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestItem {
  description: string;
  quantity: number;
  estimated_unit_price: number;
  estimated_total: number;
  specifications?: string;
  preferred_brand?: string;
  category?: string;
}

export interface PurchaseStats {
  purchase_orders: {
    status_breakdown: StatusBreakdown[];
    total_orders: number;
    total_value: number;
  };
  purchase_requests: {
    status_breakdown: StatusBreakdown[];
    total_requests: number;
    total_estimated_value: number;
  };
  monthly_spending: MonthlySpending[];
  top_vendors: TopVendor[];
}

class PurchaseService {
  // Purchase Orders
  async getPurchaseOrders(params?: PurchaseQueryParams): Promise<GetPurchaseOrdersResponse> {
    try {
      const queryParams = new URLSearchParams(params as Record<string, string> || {}).toString();
      const response = await api.get<ApiResponse<GetPurchaseOrdersResponse>>(`/purchase-management/orders?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase orders');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch purchase orders';
      throw new Error(errorMessage);
    }
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-management/orders/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase order');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch purchase order';
      throw new Error(errorMessage);
    }
  }

  async createPurchaseOrder(orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.post<ApiResponse<PurchaseOrder>>('/purchase-management/orders', orderData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create purchase order');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase order';
      throw new Error(errorMessage);
    }
  }

  async updatePurchaseOrderStatus(id: string, status: string, comments?: string): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<{ message: string }>>(`/purchase-management/orders/${id}/status`, {
        status,
        comments
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update purchase order status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update purchase order status';
      throw new Error(errorMessage);
    }
  }

  // Purchase Requests
  async getPurchaseRequests(params?: Record<string, string>): Promise<{
    purchase_requests: PurchaseRequest[];
    pagination: { page: number; limit: number; total: number };
  }> {
    try {
      const queryParams = new URLSearchParams(params || {}).toString();
      const response = await api.get<ApiResponse<any>>(`/purchase-management/requests?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase requests');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to fetch purchase requests');
    }
  }

  async createPurchaseRequest(requestData: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    try {
      const response = await api.post<ApiResponse<PurchaseRequest>>('/purchase-management/requests', requestData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create purchase request');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to create purchase request');
    }
  }

  // Statistics
  async getPurchaseStats(): Promise<PurchaseStats> {
    try {
      const response = await api.get<ApiResponse<PurchaseStats>>('/purchase-management/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase statistics');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to fetch purchase statistics');
    }
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;