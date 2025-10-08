import { User } from '@supabase/supabase-js';

import { UserRole } from './index';
export type Role = UserRole;

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  full_name?: string;
  department?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  user_metadata: {
    role: Role;
    full_name?: string;
    department?: string;
  };
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  full_name: string;
  department?: string;
  role?: Role;
}