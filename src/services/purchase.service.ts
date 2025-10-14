import api from './api';
import { ApiResponse } from '../types';

// Purchase Management Service
export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor: any;
  items: PurchaseOrderItem[];
  status: 'pending' | 'approved' | 'sent' | 'partially_received' | 'completed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  requested_by: any;
  approved_by?: any;
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
  requester: any;
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
    status_breakdown: any[];
    total_orders: number;
    total_value: number;
  };
  purchase_requests: {
    status_breakdown: any[];
    total_requests: number;
    total_estimated_value: number;
  };
  monthly_spending: any[];
  top_vendors: any[];
}

class PurchaseService {
  // Purchase Orders
  async getPurchaseOrders(params?: any): Promise<{
    purchase_orders: PurchaseOrder[];
    pagination: any;
  }> {
    try {
      const queryParams = new URLSearchParams(params || {}).toString();
      const response = await api.get<ApiResponse<any>>(`/purchase-management/orders?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase orders');
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch purchase orders');
    }
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-management/orders/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase order');
    } catch (error: any) {
      console.error('Error fetching purchase order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch purchase order');
    }
  }

  async createPurchaseOrder(orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.post<ApiResponse<PurchaseOrder>>('/purchase-management/orders', orderData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create purchase order');
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create purchase order');
    }
  }

  async updatePurchaseOrderStatus(id: string, status: string, comments?: string): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>(`/purchase-management/orders/${id}/status`, {
        status,
        comments
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update purchase order status');
      }
    } catch (error: any) {
      console.error('Error updating purchase order status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update purchase order status');
    }
  }

  // Purchase Requests
  async getPurchaseRequests(params?: any): Promise<{
    purchase_requests: PurchaseRequest[];
    pagination: any;
  }> {
    try {
      const queryParams = new URLSearchParams(params || {}).toString();
      const response = await api.get<ApiResponse<any>>(`/purchase-management/requests?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch purchase requests');
    } catch (error: any) {
      console.error('Error fetching purchase requests:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch purchase requests');
    }
  }

  async createPurchaseRequest(requestData: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    try {
      const response = await api.post<ApiResponse<PurchaseRequest>>('/purchase-management/requests', requestData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create purchase request');
    } catch (error: any) {
      console.error('Error creating purchase request:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create purchase request');
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
    } catch (error: any) {
      console.error('Error fetching purchase statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch purchase statistics');
    }
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;