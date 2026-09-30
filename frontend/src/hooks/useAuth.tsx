import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { UserProfile, UserRole } from '@/types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    collegeId?: string,
    collegeName?: string
  ) => Promise<{ error: Error | null }>;
  signInWithGitHub: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCollege: (collegeId: string, collegeName: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local mock storage key for development without live Supabase
const MOCK_AUTH_STORAGE_KEY = 'verniq_mock_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, userMeta?: Record<string, unknown>, userEmail?: string) => {
    if (!configured) {
      // Offline fallback profile
      setProfile((prev) => prev || {
        id: userId,
        username: (userMeta?.username as string) || (userEmail ? userEmail.split('@')[0] : 'engineer_dev'),
        full_name: (userMeta?.full_name as string) || 'Demo Engineer',
        avatar_url: null,
        role: 'student',
        bio: 'Systems and Algorithms Engineer',
        github_username: null,
        linkedin_url: null,
        college_id: (userMeta?.college_id as string) || 'col-iitb',
        college_name: (userMeta?.college_name as string) || 'Indian Institute of Technology Bombay',
        score: 820,
        problems_solved_count: 42,
        current_streak: 3,
        max_streak: 14,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, colleges:college_id(name)')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback if profile trigger has slight delay
        setProfile({
          id: userId,
          username: (userMeta?.username as string) || (userEmail ? userEmail.split('@')[0] : 'engineer_dev'),
          full_name: (userMeta?.full_name as string) || 'VERNIQ Engineer',
          avatar_url: (userMeta?.avatar_url as string) || null,
          role: 'student',
          bio: null,
          github_username: null,
          linkedin_url: null,
          college_id: (userMeta?.college_id as string) || null,
          college_name: (userMeta?.college_name as string) || null,
          score: 0,
          problems_solved_count: 0,
          current_streak: 0,
          max_streak: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (data) {
        const collegeObj = data.colleges as { name?: string } | null;
        setProfile({
          ...(data as UserProfile),
          college_name: collegeObj?.name || null,
        });
      }
    } catch {
      // Graceful fallback
    }
  }, [configured]);

  useEffect(() => {
    if (configured) {
      // 1. Initial Session Check
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          fetchProfile(
            initialSession.user.id,
            initialSession.user.user_metadata,
            initialSession.user.email
          );
        }
        setLoading(false);
      });

      // 2. Auth State Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchProfile(
              currentSession.user.id,
              currentSession.user.user_metadata,
              currentSession.user.email
            );
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline/Local mock auth detection
      const savedMock = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
      if (savedMock) {
        try {
          const parsed = JSON.parse(savedMock);
          setUser(parsed.user);
          setSession(parsed.session);
          setProfile(parsed.profile);
        } catch {
          localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
  }, [configured, fetchProfile]);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!configured) {
      // Demo mock login
      const mockId = 'mock-' + Math.random().toString(36).substring(2, 9);
      const isRoleAdmin = email.toLowerCase().includes('admin');
      const mockUser: User = {
        id: mockId,
        app_metadata: {},
        user_metadata: {
          full_name: isRoleAdmin ? 'Administrator' : 'Aarav Sharma',
          username: email.split('@')[0],
          college_id: isRoleAdmin ? 'col-iiith' : 'col-iitb',
          college_name: isRoleAdmin ? 'International Institute of Information Technology, Hyderabad' : 'Indian Institute of Technology Bombay',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User;

      const mockSession: Session = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      };

      const mockProfile: UserProfile = {
        id: mockId,
        username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 15) || 'student_dev',
        full_name: isRoleAdmin ? 'Administrator' : 'Aarav Sharma',
        avatar_url: null,
        role: (isRoleAdmin ? 'admin' : 'student') as UserRole,
        bio: 'Systems and Algorithms Engineer @ VERNIQ',
        github_username: 'aarav-code',
        linkedin_url: null,
        college_id: isRoleAdmin ? 'col-iiith' : 'col-iitb',
        college_name: isRoleAdmin ? 'International Institute of Information Technology, Hyderabad' : 'Indian Institute of Technology Bombay',
        score: isRoleAdmin ? 1480 : 890,
        problems_solved_count: isRoleAdmin ? 76 : 48,
        current_streak: 5,
        max_streak: 18,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(mockUser);
      setSession(mockSession);
      setProfile(mockProfile);
      localStorage.setItem(
        MOCK_AUTH_STORAGE_KEY,
        JSON.stringify({ user: mockUser, session: mockSession, profile: mockProfile })
      );
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user.id, data.user.user_metadata, data.user.email);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    collegeId?: string,
    collegeName?: string
  ): Promise<{ error: Error | null }> => {
    if (!configured) {
      const mockId = 'mock-' + Math.random().toString(36).substring(2, 9);
      const mockUser: User = {
        id: mockId,
        app_metadata: {},
        user_metadata: { full_name: fullName, username, college_id: collegeId, college_name: collegeName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User;

      const mockSession: Session = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      };

      const mockProfile: UserProfile = {
        id: mockId,
        username,
        full_name: fullName,
        avatar_url: null,
        role: 'student',
        bio: 'VERNIQ Engineering Platform Member',
        github_username: null,
        linkedin_url: null,
        college_id: collegeId || null,
        college_name: collegeName || null,
        score: 100,
        problems_solved_count: 5,
        current_streak: 1,
        max_streak: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(mockUser);
      setSession(mockSession);
      setProfile(mockProfile);
      localStorage.setItem(
        MOCK_AUTH_STORAGE_KEY,
        JSON.stringify({ user: mockUser, session: mockSession, profile: mockProfile })
      );
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            college_id: collegeId,
          },
        },
      });

      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user.id, { username, full_name: fullName, college_id: collegeId }, email);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updateCollege = async (collegeId: string, collegeName: string): Promise<{ error: Error | null }> => {
    if (!profile) return { error: new Error('User not authenticated') };

    if (!configured) {
      const updatedProfile = {
        ...profile,
        college_id: collegeId,
        college_name: collegeName,
        updated_at: new Date().toISOString(),
      };
      setProfile(updatedProfile);
      if (user && session) {
        localStorage.setItem(
          MOCK_AUTH_STORAGE_KEY,
          JSON.stringify({ user, session, profile: updatedProfile })
        );
      }
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ college_id: collegeId })
        .eq('id', profile.id);

      if (error) return { error };
      setProfile((prev) => (prev ? { ...prev, college_id: collegeId, college_name: collegeName } : null));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGitHub = async (): Promise<{ error: Error | null }> => {
    if (!configured) {
      return signInWithEmail('github.engineer@verniq.io', 'mockpassword');
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + '/app/dashboard',
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<{ error: Error | null }> => {
    if (!configured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async (): Promise<void> => {
    if (configured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id, user.user_metadata, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGitHub,
        resetPasswordForEmail,
        signOut,
        refreshProfile,
        updateCollege,
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
