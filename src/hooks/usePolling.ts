/**
 * REAL-TIME POLLING HOOK
 * 
 * Implements smart polling for real-time data updates without Socket.IO
 * Features:
 * - Auto-refresh with configurable intervals
 * - Pause polling when tab is hidden (Page Visibility API)
 * - Exponential backoff on errors
 * - Manual refresh capability
 * 
 * Usage:
 * const { data, loading, error, refresh } = usePolling(fetchFunction, {
 *   interval: 30000, // 30 seconds
 *   enabled: true
 * });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions {
  interval?: number; // Polling interval in milliseconds (default: 30000 = 30s)
  enabled?: boolean; // Enable/disable polling (default: true)
  retryOnError?: boolean; // Retry on error with exponential backoff (default: true)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  onError?: (error: any) => void; // Error callback
  onSuccess?: (data: any) => void; // Success callback
}

export function usePolling<T>(
  fetchFunction: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const {
    interval = 30000,
    enabled = true,
    retryOnError = true,
    maxRetries = 3,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Store fetchFunction in ref to avoid re-creating fetchData on every render
  const fetchFunctionRef = useRef(fetchFunction);
  
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const fetchData = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent concurrent requests

    try {
      isPollingRef.current = true;
      setError(null);
      
      const result = await fetchFunctionRef.current();
      setData(result);
      setRetryCount(0); // Reset retry count on success
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      }

      // Exponential backoff retry logic
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
      isPollingRef.current = false;
    }
  }, [retryCount, maxRetries, retryOnError, onSuccess, onError]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Setup polling with Page Visibility API
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Prevent double-initialization in React Strict Mode
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Initial fetch
    fetchData();

    // Calculate interval with exponential backoff on errors
    const currentInterval = retryCount > 0 
      ? Math.min(interval * Math.pow(2, retryCount), 300000) // Max 5 minutes
      : interval;

    // Setup polling interval
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchData();
      }
    }, currentInterval);

    // Pause polling when tab is hidden (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        if (isMountedRef.current) {
          fetchData();
        }
        if (!intervalRef.current && isMountedRef.current) {
          intervalRef.current = setInterval(() => {
            if (isMountedRef.current) {
              fetchData();
            }
          }, currentInterval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, retryCount]); // Remove fetchData from dependencies

  return {
    data,
    loading,
    error,
    refresh,
    isPolling: enabled && !isPollingRef.current,
  };
}

export default usePolling;
