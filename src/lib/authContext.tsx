import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, AUTHORIZED_ADMIN_UID } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthorizedAdmin: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkAdminAuthorization: (userId: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Verify if the user is an authorized admin using:
   * 1. Known primary admin UID (435fc0df-d9b5-429c-be28-40f58556c689)
   * 2. public.is_dashboard_admin() RPC function
   * 3. dashboard_admins table query (matching actual schema: user_id)
   */
  const checkAdminAuthorization = useCallback(async (userId: string): Promise<boolean> => {
    // 1. Direct check against verified primary administrator UID
    if (userId === AUTHORIZED_ADMIN_UID) {
      return true;
    }

    try {
      // 2. Call public.is_dashboard_admin() RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('is_dashboard_admin');
      if (!rpcError && rpcResult === true) {
        return true;
      }
    } catch {
      // RPC might not be accessible if RLS or role configuration differs
    }

    try {
      // 3. Query dashboard_admins table directly
      const { data: adminRows, error: adminTableError } = await supabase
        .from('dashboard_admins')
        .select('user_id')
        .eq('user_id', userId);

      if (!adminTableError && adminRows && adminRows.length > 0) {
        return true;
      }
    } catch {
      // Table may have RLS
    }

    return false;
  }, []);

  const handleSessionChange = useCallback(
    async (currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const isAuth = await checkAdminAuthorization(currentUser.id);
        setIsAuthorizedAdmin(isAuth);
      } else {
        setIsAuthorizedAdmin(false);
      }
      setIsLoading(false);
    },
    [checkAdminAuthorization]
  );

  useEffect(() => {
    // Initial session recovery
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    }).catch((err) => {
      console.error('Failed to get initial Supabase session:', err);
      setIsLoading(false);
    });

    // Realtime auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authorized = await checkAdminAuthorization(data.user.id);
        setIsAuthorizedAdmin(authorized);
        if (!authorized) {
          return {
            success: true, // Login succeeded, but authorization check will show unauthorized screen
          };
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAuthorizedAdmin(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset link';
      return { success: false, error: msg };
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthorizedAdmin,
        authError,
        signIn,
        signOut,
        resetPassword,
        checkAdminAuthorization,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
