import api from './api';
import { ApiResponse } from '../types';

// Notification Service
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    info: number;
    success: number;
    warning: number;
    error: number;
    approval: number;
  };
}

export interface NotificationPagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

class NotificationService {
  // Get user notifications
  async getNotifications(page = 1, limit = 20): Promise<{
    notifications: Notification[];
    pagination: NotificationPagination;
    stats: NotificationStats;
  }> {
    try {
      const response = await api.get<ApiResponse<any>>(`/notifications?page=${page}&limit=${limit}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch notifications');
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: { message?: string } }; message: string };
      console.error('Error fetching notifications:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>(`/notifications/${notificationId}/read`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>('/notifications/mark-all-read');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to mark all notifications as read');
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<any>>(`/notifications/${notificationId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete notification');
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete notification');
    }
  }

  // Get notification stats
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await api.get<ApiResponse<NotificationStats>>('/notifications/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch notification stats');
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch notification stats');
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;