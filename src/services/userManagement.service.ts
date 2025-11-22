import api from './api';
import { ApiResponse, Pagination } from '../types';

// User Management Service
export interface User {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'AUDITOR';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  hire_date?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
  percentage: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  users: User[];
  pagination: Pagination;
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
  };
  department_breakdown: DepartmentBreakdown[];
  recent_registrations: User[];
  recent_logins: User[];
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  employee_id: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'AUDITOR';
  department: string;
  phone?: string;
  hire_date?: string;
  password: string;
}

class UserManagementService {
  // Get all users with filtering
  async getUsers(params?: UserQueryParams): Promise<GetUsersResponse> {
    try {
      const queryParams = new URLSearchParams(params as Record<string, string> || {}).toString();
      const response = await api.get<ApiResponse<GetUsersResponse>>(`/admin/users?${queryParams}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch users');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      throw new Error(errorMessage);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      throw new Error(errorMessage);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      throw new Error(errorMessage);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      throw new Error(errorMessage);
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(`/admin/users/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      throw new Error(errorMessage);
    }
  }

  // Update user status
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<{ message: string }>>(`/admin/users/${id}/status`, { status });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
      throw new Error(errorMessage);
    }
  }

  // Reset user password
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<{ message: string }>>(`/admin/users/${id}/reset-password`, {
        new_password: newPassword
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      throw new Error(errorMessage);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user statistics';
      throw new Error(errorMessage);
    }
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      const response = await api.patch<ApiResponse<{ updated: number; message: string }>>('/admin/users/bulk-status', {
        user_ids: userIds,
        status
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
      throw new Error(errorMessage);
    }
  }
}

export const userManagementService = new UserManagementService();
export default userManagementService;