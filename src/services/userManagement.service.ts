import api from './api';
import { ApiResponse } from '../types';

// User Management Service
export interface User {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'AUDITOR' | 'EMPLOYEE';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  hire_date?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  role_breakdown: {
    ADMIN: number;
    INVENTORY_MANAGER: number;
    AUDITOR: number;
    EMPLOYEE: number;
  };
  department_breakdown: any[];
  recent_registrations: User[];
  recent_logins: User[];
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  employee_id: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'AUDITOR' | 'EMPLOYEE';
  department: string;
  phone?: string;
  hire_date?: string;
  password: string;
}

class UserManagementService {
  // Get all users with filtering
  async getUsers(params?: any): Promise<{
    users: User[];
    pagination: any;
  }> {
    try {
      const queryParams = new URLSearchParams(params || {}).toString();
      const response = await api.get<ApiResponse<any>>(`/admin/users?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch users');
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch user');
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user');
    }
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>('/admin/users', userData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create user');
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create user');
    }
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>(`/admin/users/${id}`, userData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to update user');
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update user');
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<any>>(`/admin/users/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete user');
    }
  }

  // Update user status
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>(`/admin/users/${id}/status`, { status });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update user status');
    }
  }

  // Reset user password
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>(`/admin/users/${id}/reset-password`, {
        new_password: newPassword
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reset password');
    }
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<ApiResponse<UserStats>>('/admin/users/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch user statistics');
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user statistics');
    }
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<any>>('/admin/users/bulk-status', {
        user_ids: userIds,
        status
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update user status');
    }
  }
}

export const userManagementService = new UserManagementService();
export default userManagementService;