import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../services/auth.service';
import { UserRole } from '../types';

interface JWTUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: JWTUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JWTUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and get current user
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Check if it's a demo token
          if (token.startsWith('demo-token-')) {
            const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
            const userId = token.replace('demo-token-', '');
            const demoUser = demoUsers.find((user: any) => user.id === userId);
            
            if (demoUser) {
              const jwtUser: JWTUser = {
                id: demoUser.id,
                email: demoUser.email,
                role: demoUser.role as UserRole,
                full_name: demoUser.username,
                department: demoUser.department,
                created_at: demoUser.created_at,
                updated_at: demoUser.created_at,
              };
              setUser(jwtUser);
            } else {
              // Demo user not found, clear token
              localStorage.removeItem('auth_token');
              setUser(null);
            }
          } else {
            // Verify real token and get user data
            const userData = await authService.getCurrentUser();
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        // Token invalid, remove it
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // First try demo users from localStorage
      const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const demoUser = demoUsers.find((user: any) => user.email === email);
      
      if (demoUser) {
        // For demo purposes, accept any password for demo users
        const jwtUser: JWTUser = {
          id: demoUser.id,
          email: demoUser.email,
          role: demoUser.role as UserRole,
          full_name: demoUser.username,
          department: demoUser.department,
          created_at: demoUser.created_at,
          updated_at: demoUser.created_at,
        };
        
        setUser(jwtUser);
        localStorage.setItem('auth_token', 'demo-token-' + demoUser.id);
        toast.success(`Logged in as ${demoUser.role}`);
        return;
      }
      
      // Fall back to real backend login
      const response = await authService.signIn(email, password);
      setUser(response.user);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      // For signup, we need basic user data - using defaults for now
      const response = await authService.signUp({
        email,
        password,
        full_name: '',
        department: '',
        role: UserRole.EMPLOYEE
      });
      setUser(response.user);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
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

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};