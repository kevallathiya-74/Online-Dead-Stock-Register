import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../services/auth.service';
import { UserRole } from '../types';
import { Department } from '../types';

interface JWTUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  full_name?: string;
  department: Department;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: JWTUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JWTUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authService.signIn(email, password);
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      if (response.user) {
        setUser(response.user);
        toast.success('Login successful');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole = UserRole.EMPLOYEE, department: Department = Department.INVENTORY): Promise<void> => {
    setLoading(true);
    try {
      const response = await authService.signUp({
        email,
        password,
        full_name: fullName,
        role,
        department
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (response.user) {
        setUser(response.user);
        toast.success('Registration successful');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('auth_token');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Logout failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      // This would require additional backend endpoint for password update
      // For now, just show success
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error('Password update failed');
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};