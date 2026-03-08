// Authentication Hook - e-control CRM Pro
import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  department?: string;
  position?: string;
  hourly_rate?: number;
  is_active?: boolean;
}

type AppRole = 'admin' | 'manager' | 'employee' | 'client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isClient: boolean;
  clientId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  const fetchClientId = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setClientId(data.id);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    if (data) {
      setProfile(data as Profile);
    }
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    console.log('Fetching roles for user:', userId);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    
    console.log('Fetched roles:', data);
    if (data && data.length > 0) {
      const userRoles = data.map(r => r.role as AppRole);
      console.log('Setting roles:', userRoles);
      setRoles(userRoles);
    }
  }, []);

  useEffect(() => {
    console.log('🔐 [useAuth] Setting up auth listener...');
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 [useAuth] Auth state changed:', event, session?.user?.email || 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/roles fetch with setTimeout
        if (session?.user) {
          console.log('👤 [useAuth] Fetching user data for:', session.user.email);
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
            fetchClientId(session.user.id);
          }, 0);
        } else {
          console.log('🚪 [useAuth] No user - clearing state');
          setProfile(null);
          setRoles([]);
          setClientId(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    console.log('🔍 [useAuth] Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 [useAuth] Existing session:', session?.user?.email || 'None');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 [useAuth] Loading user data from session...');
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
        fetchClientId(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('🔐 [useAuth] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchRoles, fetchClientId]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${globalThis.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    
    return { error: error ? new Error(error.message) : null };
  };

  const requestPasswordReset = async (email: string) => {
    const redirectTo = `${globalThis.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setClientId(null);
    setRoles([]);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager') || isAdmin;
  const isClient = roles.includes('client');

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      roles,
      isLoading,
      isAdmin,
      isManager,
      isClient,
      clientId,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut,
      updateProfile,
    }),
    [
      user,
      session,
      profile,
      roles,
      isLoading,
      isAdmin,
      isManager,
      isClient,
      clientId,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing during initial render
    console.warn('useAuth was called outside of AuthProvider, returning defaults');
    return {
      user: null,
      session: null,
      profile: null,
      roles: [],
      isLoading: true,
      isAdmin: false,
      isManager: false,
      isClient: false,
      clientId: null,
      signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
      signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
      requestPasswordReset: async () => ({ error: new Error('AuthProvider not mounted') }),
      updatePassword: async () => ({ error: new Error('AuthProvider not mounted') }),
      signOut: async () => {},
      updateProfile: async () => ({ error: new Error('AuthProvider not mounted') }),
    };
  }
  return context;
}
