import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api.config';
import { UserRole, Department } from '../types';

// JWT Authentication interfaces
interface JWTAuthError {
  name: string;
  message: string;
  status: number;
}

interface JWTUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  department: Department;
  created_at: string;
  updated_at: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpData extends LoginCredentials {
  full_name: string;
  department: Department;
  role?: UserRole;
}

interface AuthResponse {
  user: JWTUser | null;
  token?: string | null;
  error: JWTAuthError | null;
}

// Utility function to create a standard auth error
const createAuthError = (message: string, status: number = 500): JWTAuthError => {
  return {
    name: 'AuthError',
    message,
    status
  };
};

// Get stored token from localStorage
const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

// Store token in localStorage
const storeToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const authService = {
  async signUp({ email, password, full_name, department, role = UserRole.EMPLOYEE }: SignUpData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
        email,
        password,
        full_name,
        department,
        role
      });

      const { user, token } = response.data;
      if (token) {
        storeToken(token);
      }

      return {
        user,
        token,
        error: null
      };
    } catch (error: any) {
      return {
        user: null,
        token: null,
        error: createAuthError(
          error.response?.data?.message || 'Registration failed',
          error.response?.status || 500
        )
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        email,
        password
      });

      const { user, token } = response.data;
      if (token) {
        storeToken(token);
      }

      return {
        user,
        token,
        error: null
      };
    } catch (error: any) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        user: null,
        token: null,
        error: createAuthError(
          error.response?.data?.message || 'Login failed',
          error.response?.status || 401
        )
      };
    }
  },

  async signOut(): Promise<{ error: JWTAuthError | null }> {
    try {
      removeToken();
      return { error: null };
    } catch (error: any) {
      return { error: createAuthError('Sign out failed', 500) };
    }
  },

  async resetPassword(email: string): Promise<{ error: JWTAuthError | null }> {
    try {
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, { email });
      return { error: null };
    } catch (error: any) {
      return {
        error: createAuthError(
          error.response?.data?.message || 'Password reset request failed',
          error.response?.status || 500
        )
      };
    }
  },

  async updatePassword(newPassword: string, token?: string): Promise<{ error: JWTAuthError | null }> {
    try {
      const resetToken = token || getStoredToken();
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.RESET_PASSWORD}`, {
        password: newPassword,
        token: resetToken
      });
      return { error: null };
    } catch (error: any) {
      return {
        error: createAuthError(
          error.response?.data?.message || 'Password update failed',
          error.response?.status || 500
        )
      };
    }
  },

  async getCurrentUser(): Promise<JWTUser | null> {
    try {
      const token = getStoredToken();
      if (!token) return null;

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.user;
    } catch (error) {
      removeToken(); // Invalid token, remove it
      return null;
    }
  },

  getToken(): string | null {
    return getStoredToken();
  },

  isAuthenticated(): boolean {
    return !!getStoredToken();
  }
};

export default authService;
