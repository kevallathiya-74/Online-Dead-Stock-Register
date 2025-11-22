import { toast } from 'react-toastify';

/**
 * Standardized error handling utility
 * Extracts meaningful error messages from various error formats
 */

export interface ApiError {
  success: false;
  error?: string;
  message?: string;
  details?: string;
  statusCode?: number;
}

/**
 * Extract error message from various error response formats
 */
export const getErrorMessage = (error: unknown): string => {
  // Axios error response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiError } };
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      return data.error || data.message || data.details || 'An error occurred';
    }
  }

  // Axios error without response
  if (error && typeof error === 'object' && 'request' in error) {
    return 'Network error. Please check your connection.';
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return 'An unexpected error occurred';
};

/**
 * Handle API errors with toast notifications
 */
export const handleApiError = (error: unknown, context?: string): void => {
  const message = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;
  
  toast.error(fullMessage, {
    autoClose: 5000,
    position: 'top-right',
  });
};

/**
 * Handle success with toast notification
 */
export const handleApiSuccess = (message: string): void => {
  toast.success(message, {
    autoClose: 3000,
    position: 'top-right',
  });
};

/**
 * Handle warnings with toast notification
 */
export const handleApiWarning = (message: string): void => {
  toast.warning(message, {
    autoClose: 4000,
    position: 'top-right',
  });
};

/**
 * Handle info with toast notification
 */
export const handleApiInfo = (message: string): void => {
  toast.info(message, {
    autoClose: 3000,
    position: 'top-right',
  });
};

/**
 * Format currency to Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number to Indian locale
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format date to Indian locale
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('en-IN', defaultOptions).format(dateObj);
};

/**
 * Format date and time to Indian locale
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculate days until a future date
 */
export const daysUntil = (futureDate: Date | string): number => {
  const future = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;
  const now = new Date();
  
  const diffTime = future.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Get status color based on status value
 */
export const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('active') || statusLower.includes('available') || statusLower.includes('approved')) {
    return 'success';
  }
  
  if (statusLower.includes('disposed') || statusLower.includes('rejected') || statusLower.includes('failed')) {
    return 'error';
  }
  
  if (statusLower.includes('pending') || statusLower.includes('maintenance') || statusLower.includes('damaged')) {
    return 'warning';
  }
  
  if (statusLower.includes('ready')) {
    return 'info';
  }
  
  return 'default';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Download file from blob
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
