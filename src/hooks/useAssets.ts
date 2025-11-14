/**
 * Custom React Query hooks for Asset operations
 * Provides optimized data fetching with caching, background updates, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

// Types
interface Asset {
  _id: string;
  unique_asset_id: string;
  name?: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  department: string;
  purchase_date?: string;
  purchase_cost?: number;
  assigned_user?: any;
  [key: string]: any;
}

interface AssetFilters {
  status?: string;
  department?: string;
  asset_type?: string;
  location?: string;
  search?: string;
  purchaseStartDate?: string;
  purchaseEndDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query Keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetFilters) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
  myAssets: () => [...assetKeys.all, 'my-assets'] as const,
};

/**
 * Fetch assets with filters and pagination
 */
export const useAssets = (filters: AssetFilters = {}, options?: UseQueryOptions<PaginatedResponse<Asset>>) => {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Asset>>('/assets', { params: filters });
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Fetch single asset by ID with audit history
 */
export const useAsset = (assetId: string, options?: UseQueryOptions<Asset>) => {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: async () => {
      const { data } = await api.get(`/assets/${assetId}`);
      return data.data;
    },
    enabled: !!assetId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Fetch current user's assigned assets
 */
export const useMyAssets = (options?: UseQueryOptions<Asset[]>) => {
  return useQuery({
    queryKey: assetKeys.myAssets(),
    queryFn: async () => {
      const { data } = await api.get('/assets/my-assets');
      return data.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * Fetch asset statistics
 */
export const useAssetStats = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: assetKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/assets/stats');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Create new asset with optimistic update
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetData: Partial<Asset>) => {
      const { data } = await api.post('/assets', assetData);
      return data.data;
    },
    onSuccess: (newAsset) => {
      // Invalidate and refetch asset lists
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
      
      toast.success('Asset created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create asset');
    },
  });
};

/**
 * Update asset with optimistic update
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, updates }: { assetId: string; updates: Partial<Asset> }) => {
      const { data } = await api.put(`/assets/${assetId}`, updates);
      return data.data;
    },
    onMutate: async ({ assetId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.detail(assetId) });
      
      // Snapshot previous value
      const previousAsset = queryClient.getQueryData(assetKeys.detail(assetId));
      
      // Optimistically update
      queryClient.setQueryData(assetKeys.detail(assetId), (old: any) => ({
        ...old,
        ...updates,
      }));
      
      return { previousAsset };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(variables.assetId),
          context.previousAsset
        );
      }
      toast.error(error.response?.data?.message || 'Failed to update asset');
    },
    onSuccess: (updatedAsset, variables) => {
      // Update cache with server response
      queryClient.setQueryData(assetKeys.detail(variables.assetId), updatedAsset);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
      
      toast.success('Asset updated successfully');
    },
  });
};

/**
 * Delete asset
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetId: string) => {
      await api.delete(`/assets/${assetId}`);
      return assetId;
    },
    onSuccess: (assetId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: assetKeys.detail(assetId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
      
      toast.success('Asset deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    },
  });
};

/**
 * Bulk delete assets
 */
export const useBulkDeleteAssets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetIds: string[]) => {
      await api.post('/bulk/delete-assets', { asset_ids: assetIds });
      return assetIds;
    },
    onSuccess: () => {
      // Invalidate all asset queries
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      
      toast.success('Assets deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete assets');
    },
  });
};

/**
 * Transfer asset
 */
export const useTransferAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, transferData }: { assetId: string; transferData: any }) => {
      const { data } = await api.post('/asset-transfers', {
        asset_id: assetId,
        ...transferData,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      toast.success('Asset transfer initiated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to transfer asset');
    },
  });
};
