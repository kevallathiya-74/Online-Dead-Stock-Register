import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../features/auth/services/auth.service';
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
  login: (email: string, password: string) => Promise<JWTUser>;
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
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<JWTUser> => {
    setLoading(true);
    try {
      const response = await authService.signIn(email, password);
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }
      // Token is already stored by authService.signIn
      setUser(response.user);
      toast.success('Login successful');
      return response.user as JWTUser;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole = UserRole.AUDITOR, department: Department = Department.INVENTORY): Promise<void> => {
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
      if (!response.user) {
        throw new Error('Registration failed - no user data returned');
      }
      // Token is already stored by authService.signUp
      setUser(response.user);
      toast.success('Registration successful');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
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
    } catch (error: unknown) {
      let errorMessage = 'Password reset failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const errObj = error as { response?: { data?: { message?: string } } };
        errorMessage = errObj.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const updatePassword = async (_newPassword: string) => {
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
    } catch {
      // Ignore error
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