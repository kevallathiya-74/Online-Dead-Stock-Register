/**
 * Custom React Query hooks for User operations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Types
interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  employee_id?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  createdAt?: string;
}

interface UserFilters {
  role?: string;
  department?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

/**
 * Fetch users with filters
 */
export const useUsers = (filters: UserFilters = {}, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/users', { params: filters });
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * Fetch single user by ID
 */
export const useUser = (userId: string, options?: UseQueryOptions<User>) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}`);
      return data.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Fetch current user profile
 */
export const useProfile = (options?: UseQueryOptions<User>) => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Fetch user statistics
 */
export const useUserStats = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/users/stats');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Create new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const { data } = await api.post('/users', userData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });
};

/**
 * Update user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const { data } = await api.put(`/users/${userId}`, updates);
      return data.data;
    },
    onSuccess: (updatedUser, variables) => {
      queryClient.setQueryData(userKeys.detail(variables.userId), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });
};

/**
 * Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
};

/**
 * Change password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/users/change-password', passwordData);
      return data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });
};
