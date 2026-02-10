import api from '../services/api';
import { ApiResponse } from '../types';

/**
 * Generic API client wrapper to reduce code duplication across services
 * Handles common patterns for API calls, error handling, and response parsing
 */

/**
 * Helper to build query parameters string
 * @param params - Object with query parameters
 * @returns Query string
 */
export function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);
  
  return new URLSearchParams(filtered).toString();
}

/**
 * Generic GET request handler
 * @param endpoint - API endpoint
 * @param params - Query parameters
 * @param errorMessage - Custom error message
 * @returns Promise with response data
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, any>,
  errorMessage = 'Failed to fetch data'
): Promise<T> {
  try {
    const queryParams = params ? buildQueryString(params) : '';
    
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    const response = await api.get<ApiResponse<T>>(url);
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || errorMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    throw new Error(message);
  }
}

/**
 * Generic POST request handler
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param errorMessage - Custom error message
 * @returns Promise with response data
 */
export async function apiPost<T, D = any>(
  endpoint: string,
  data: D,
  errorMessage = 'Failed to create resource'
): Promise<T> {
  try {
    const response = await api.post<ApiResponse<T>>(endpoint, data);
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || errorMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    throw new Error(message);
  }
}

/**
 * Generic PUT request handler
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param errorMessage - Custom error message
 * @returns Promise with response data
 */
export async function apiPut<T, D = any>(
  endpoint: string,
  data: D,
  errorMessage = 'Failed to update resource'
): Promise<T> {
  try {
    const response = await api.put<ApiResponse<T>>(endpoint, data);
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || errorMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    throw new Error(message);
  }
}

/**
 * Generic PATCH request handler
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param errorMessage - Custom error message
 * @returns Promise with response data
 */
export async function apiPatch<T, D = any>(
  endpoint: string,
  data: D,
  errorMessage = 'Failed to update resource'
): Promise<T> {
  try {
    const response = await api.patch<ApiResponse<T>>(endpoint, data);
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || errorMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    throw new Error(message);
  }
}

/**
 * Generic DELETE request handler
 * @param endpoint - API endpoint
 * @param errorMessage - Custom error message
 * @returns Promise<void>
 */
export async function apiDelete(
  endpoint: string,
  errorMessage = 'Failed to delete resource'
): Promise<void> {
  try {
    const response = await api.delete<ApiResponse<any>>(endpoint);
    
    if (!response.data.success) {
      throw new Error(response.data.error || errorMessage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    throw new Error(message);
  }
}

/**
 * Type-safe API client class for service classes
 * Provides a cleaner interface for common CRUD operations
 */
export class ApiClient<T> {
  constructor(private baseEndpoint: string) {}

  async getAll(params?: Record<string, any>, errorMessage?: string): Promise<T[]> {
    return apiGet<T[]>(this.baseEndpoint, params, errorMessage);
  }

  async getById(id: string, errorMessage?: string): Promise<T> {
    return apiGet<T>(`${this.baseEndpoint}/${id}`, undefined, errorMessage);
  }

  async create(data: Partial<T>, errorMessage?: string): Promise<T> {
    return apiPost<T>(this.baseEndpoint, data, errorMessage);
  }

  async update(id: string, data: Partial<T>, errorMessage?: string): Promise<T> {
    return apiPut<T>(`${this.baseEndpoint}/${id}`, data, errorMessage);
  }

  async patch(id: string, data: Partial<T>, errorMessage?: string): Promise<T> {
    return apiPatch<T>(`${this.baseEndpoint}/${id}`, data, errorMessage);
  }

  async delete(id: string, errorMessage?: string): Promise<void> {
    return apiDelete(`${this.baseEndpoint}/${id}`, errorMessage);
  }
}
