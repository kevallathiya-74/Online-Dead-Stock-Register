import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { toast } from 'react-toastify';
import { getNotificationConfig, shouldShowNotification, NotificationTier } from '../utils/notificationConfig';

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

// Response interceptor with standardized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const notificationConfig = getNotificationConfig(error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      
      // Critical notification for auth failure
      if (notificationConfig.tier === NotificationTier.CRITICAL) {
        toast.error(notificationConfig.message, {
          position: 'top-center',
          autoClose: false,
          closeOnClick: false,
        });
      }
      
      // Delay redirect to allow user to see message
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (shouldShowNotification(notificationConfig.message)) {
      // Show notification only if not a duplicate
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