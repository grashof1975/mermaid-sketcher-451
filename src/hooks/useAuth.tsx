
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { username?: string; full_name?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting for authentication attempts
const AUTH_ATTEMPT_LIMIT = 5;
const AUTH_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
        // Log successful login
        console.log('User authenticated:', { 
          userId: session.user.id, 
          email: session.user.email,
          timestamp: new Date().toISOString()
        });
      } else {
        setProfile(null);
        setLoading(false);
      }

      // Clear auth attempts on successful login
      if (event === 'SIGNED_IN' && session?.user?.email) {
        authAttempts.delete(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const attempts = authAttempts.get(email);
    
    if (attempts) {
      // Check if lockout period has expired
      if (now - attempts.lastAttempt > AUTH_LOCKOUT_DURATION) {
        authAttempts.delete(email);
        return true;
      }
      
      // Check if limit exceeded
      if (attempts.count >= AUTH_ATTEMPT_LIMIT) {
        const remainingTime = Math.ceil((AUTH_LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 60000);
        toast({
          title: "Too many attempts",
          description: `Account locked. Try again in ${remainingTime} minutes.`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const recordFailedAttempt = (email: string) => {
    const now = Date.now();
    const attempts = authAttempts.get(email) || { count: 0, lastAttempt: now };
    authAttempts.set(email, {
      count: attempts.count + 1,
      lastAttempt: now
    });
    
    console.warn('Failed authentication attempt:', {
      email,
      attemptCount: attempts.count + 1,
      timestamp: new Date().toISOString()
    });
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: { username?: string; full_name?: string }) => {
    if (!checkRateLimit(email)) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          // Enhanced security: redirect to a specific callback URL
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        recordFailedAttempt(email);
        throw error;
      }

      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!checkRateLimit(email)) return;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        recordFailedAttempt(email);
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear any sensitive data from localStorage
    try {
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('api-key') || key.includes('temp-')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Invalidate other sessions after password change
      await supabase.auth.refreshSession();

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Reload profile
    await loadProfile(user.id);

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
