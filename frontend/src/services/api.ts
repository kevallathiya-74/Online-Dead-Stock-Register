import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api.config';
import { getNotificationConfig, NotificationTier, shouldShowNotification } from '../utils/notificationConfig';
import { clearSession, extendSession } from '../utils/sessionManagement';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with centralized error handling & session management
api.interceptors.response.use(
  (response) => {
    // Extend session on successful API calls
    extendSession();
    return response;
  },
  (error) => {
    const notificationConfig = getNotificationConfig(error);
    
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      clearSession('Your session has expired. Please log in again.');
      return Promise.reject(error);
    }
    
    // Handle authorization errors (403)
    if (error.response?.status === 403) {
      if (notificationConfig.tier === NotificationTier.CRITICAL) {
        toast.error('You do not have permission to perform this action', {
          position: 'top-center',
          autoClose: 5000,
        });
      }
    }
    
    // Show notification only if not a duplicate
    else if (shouldShowNotification(notificationConfig.message)) {
      const toastMethod = notificationConfig.type === 'error' ? toast.error : 
                         notificationConfig.type === 'warning' ? toast.warning :
                         toast.info;
      
      toastMethod(notificationConfig.message, {
        autoClose: 5000,
        position: 'bottom-right',
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;