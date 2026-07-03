/**
 * ✅ SESSION MANAGEMENT & SECURITY
 * ========================================
 * Handles session timeout, token refresh, and security
 * ONE FILE CONTROLS ALL SESSION LOGIC
 */

import { toast } from 'react-toastify';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours (matches JWT expiry)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes warning

let sessionTimer: NodeJS.Timeout | null = null;
let inactivityTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;
let warningShown = false;

/**
 * Get token expiry time
 */
export const getTokenExpiry = (): number | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
};

/**
 * Get time remaining until token expires
 */
export const getTimeUntilExpiry = (): number => {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
};

/**
 * Clear session and logout
 */
export const clearSession = (reason: string = 'Session expired') => {
  // Clear timers
  if (sessionTimer) clearTimeout(sessionTimer);
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Clear storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show message
  toast.warning(reason, { autoClose: 5000 });
  
  // Redirect to login
  window.location.href = '/login';
};

/**
 * Show session expiry warning
 */
const showExpiryWarning = () => {
  if (warningShown) return;
  warningShown = true;
  
  toast.warning(
    'Your session will expire in 5 minutes. Please save your work.',
    {
      autoClose: 10000,
      position: 'top-center',
      closeOnClick: false,
    }
  );
};

/**
 * Reset inactivity timer
 */
export const resetInactivityTimer = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  
  inactivityTimer = setTimeout(() => {
    clearSession('You have been logged out due to inactivity');
  }, INACTIVITY_TIMEOUT);
};

/**
 * Initialize session management
 */
export const initializeSession = () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // Check if token is already expired
  if (isTokenExpired()) {
    clearSession('Your session has expired');
    return;
  }
  
  // Calculate time until expiry
  const timeUntilExpiry = getTimeUntilExpiry();
  
  // Set session expiry timer
  sessionTimer = setTimeout(() => {
    clearSession('Your session has expired. Please log in again.');
  }, timeUntilExpiry);
  
  // Set warning timer (5 minutes before expiry)
  const timeUntilWarning = Math.max(0, timeUntilExpiry - WARNING_BEFORE_TIMEOUT);
  warningTimer = setTimeout(showExpiryWarning, timeUntilWarning);
  
  // Set inactivity timer
  resetInactivityTimer();
  
  // Add event listeners for user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });
};

/**
 * Clean up session management
 */
export const cleanupSession = () => {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.removeEventListener(event, resetInactivityTimer);
  });
};

/**
 * Extend session (call this after successful API calls)
 */
export const extendSession = () => {
  // Check if we need to refresh the token
  const timeUntilExpiry = getTimeUntilExpiry();
  
  if (timeUntilExpiry < 30 * 60 * 1000) { // Less than 30 minutes remaining
    // In a real app, you would call an API endpoint to refresh the token
    // For now, we just show a warning
    if (!warningShown) {
      showExpiryWarning();
    }
  }
  
  resetInactivityTimer();
}