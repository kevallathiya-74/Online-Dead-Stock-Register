import { supabase } from '../config/supabase';
import { AuthError, User } from '@supabase/supabase-js';
import { AuthUser, SignUpData, UserProfile } from '../types/auth.types';

export interface AuthResponse {
  user: AuthUser | null;
  profile?: UserProfile | null;
  error: AuthError | null;
}

export const authService = {
  async signUp({ email, password, full_name, department, role = 'user' }: SignUpData): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          department,
          role,
        }
      }
    });

    if (error || !data.user) return { user: null, error };

    // Create user profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email,
        full_name,
        department,
        role,
      }])
      .single();

    return {
      user: data.user as AuthUser,
      profile: profile as UserProfile | null,
      error: profileError
    };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) return { user: null, error };

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: data.user as AuthUser,
      profile: profile as UserProfile | null,
      error
    };
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  },

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: AuthError | null }> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (!error) {
      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: updates
      });
    }

    return { error };
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser();
    return data.user as AuthUser | null;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return data as UserProfile | null;
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as AuthUser | null);
    });
  },

  // Initialize user profile table
  async createProfilesTable() {
    const { error } = await supabase.rpc('create_profiles_table');
    return { error };
  }
};

export default authService;
