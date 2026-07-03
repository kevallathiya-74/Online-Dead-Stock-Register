import { apiDelete, apiGet, apiPatch } from '../utils/apiClient';


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
    return apiGet<{
      notifications: Notification[];
      pagination: NotificationPagination;
      stats: NotificationStats;
    }>('/notifications', { page, limit }, 'Failed to fetch notifications');
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    return apiPatch<void>(`/notifications/${notificationId}/read`, {}, 'Failed to mark notification as read');
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    return apiPatch<void>('/notifications/mark-all-read', {}, 'Failed to mark all notifications as read');
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    return apiDelete(`/notifications/${notificationId}`, 'Failed to delete notification');
  }

  // Get notification stats
  async getNotificationStats(): Promise<NotificationStats> {
    return apiGet<NotificationStats>('/notifications/stats', undefined, 'Failed to fetch notification stats');
  }
}

export const notificationService = new NotificationService();
export default notificationService;