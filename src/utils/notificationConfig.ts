// This file contains centralized notification configuration and utilities
// Implementation of Notification Tier System for MERN Stack

export const NotificationTier = {
  CRITICAL: 'P0',    // Authentication failures, critical errors - Modal/Banner
  HIGH: 'P1',        // Primary task failures, data warnings - Persistent Top Bar
  MEDIUM: 'P2',      // CRUD operations, validation errors - Toast (5-7s)
  LOW: 'P3',         // Background tasks, logging - Console/Audit only
};

export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Define which operations should NOT show toast notifications (P3 - Low Priority)
export const SILENT_OPERATIONS = [
  'health-check',
  'token-refresh',
  'auto-save',
  'background-sync',
  'polling-update',
  'cache-update',
];

// Standard error messages mapping
export const ERROR_MESSAGES = {
  // Authentication (P0 - Critical)
  401: { message: 'Session expired. Please log in again.', tier: NotificationTier.CRITICAL, type: NotificationType.ERROR },
  403: { message: 'You do not have permission to perform this action.', tier: NotificationTier.CRITICAL, type: NotificationType.ERROR },
  
  // Server Errors (P1 - High)
  500: { message: 'A server error occurred. Please try again later.', tier: NotificationTier.HIGH, type: NotificationType.ERROR },
  503: { message: 'Service temporarily unavailable. Please try again later.', tier: NotificationTier.HIGH, type: NotificationType.ERROR },
  
  // Client Errors (P2 - Medium)
  400: { message: 'Please check the required fields and try again.', tier: NotificationTier.MEDIUM, type: NotificationType.ERROR },
  404: { message: 'The requested item could not be found.', tier: NotificationTier.MEDIUM, type: NotificationType.ERROR },
  409: { message: 'This item already exists or conflicts with existing data.', tier: NotificationTier.MEDIUM, type: NotificationType.WARNING },
  422: { message: 'Validation failed. Please check your input.', tier: NotificationTier.MEDIUM, type: NotificationType.ERROR },
};

// Track recent notifications to prevent duplicates
const recentNotifications = new Map<string, number>();
const DUPLICATE_THRESHOLD = 5000; // 5 seconds

/**
 * Check if notification should be shown (duplication suppression)
 */
export const shouldShowNotification = (message: string): boolean => {
  const now = Date.now();
  const lastShown = recentNotifications.get(message);
  
  if (lastShown && now - lastShown < DUPLICATE_THRESHOLD) {
    return false; // Suppress duplicate
  }
  
  recentNotifications.set(message, now);
  
  // Clean up old entries
  if (recentNotifications.size > 100) {
    const oldestKey = Array.from(recentNotifications.keys())[0];
    recentNotifications.delete(oldestKey);
  }
  
  return true;
};

interface ErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  status?: number;
}

/**
 * Get standardized notification config from error/response
 */
export const getNotificationConfig = (error: unknown) => {
  const errorResponse = error as ErrorResponse;
  const status = errorResponse?.response?.status || errorResponse?.status;
  const errorConfig = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
  
  if (errorConfig) {
    return {
      message: errorResponse?.response?.data?.message || errorConfig.message,
      tier: errorConfig.tier,
      type: errorConfig.type,
    };
  }
  
  // Default for unknown errors
  const defaultError = error as { message?: string };
  return {
    message: defaultError?.message || 'An unexpected error occurred',
    tier: NotificationTier.MEDIUM,
    type: NotificationType.ERROR,
  };
};

/**
 * Determine if operation should be silent (no toast)
 */
export const isSilentOperation = (operationName: string): boolean => {
  return SILENT_OPERATIONS.includes(operationName);
};
