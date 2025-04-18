import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthContextType, User as AppUser } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(User & { status?: AppUser['status'] }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        console.error('fetchUserProfile called with no userId');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, banner_color, banner_url, status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile from database:', error);
        throw error;
      }

      if (!data) {
        console.error('No profile data found for user:', userId);
        return await createUserProfile(userId);
      }

      const userStatus = 'online' as AppUser['status'];
      
      setUser(prev => prev ? { ...prev, status: userStatus } : null);
      
      setAppUser({
        id: data.id,
        username: data.username || `user_${userId.substring(0, 6)}`,
        avatar: data.avatar_url,
        provider: 'email',
        role: data.role || 'user',
        status: userStatus,
        banner_color: data.banner_color,
        banner_url: data.banner_url
      });
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      return null;
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const newProfile = {
        id: userId,
        username: `user_${userId.substring(0, 6)}`,
        role: 'user' as const
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }

      const userStatus = 'online' as AppUser['status'];
      
      setUser(prev => prev ? { ...prev, status: userStatus } : null);
      
      setAppUser({
        id: userId,
        username: newProfile.username,
        provider: 'email',
        role: 'user',
        status: userStatus,
        banner_color: null,
        banner_url: null
      });

      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast.error('Failed to create user profile');
      return null;
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>): Promise<boolean> => {
    if (!user) {
      console.error('updateUserProfile called with no user');
      toast.error('Please log in to update your profile');
      return false;
    }
    
    try {
      console.log('Attempting to update profile for user:', user.id);
      console.log('Updates:', updates);
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, banner_color, banner_url, status')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.error('Error checking profile existence:', fetchError);
        if (fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
      }
      
      if (!existingProfile) {
        console.log('Profile does not exist, creating new profile');
        await createUserProfile(user.id);
        return true;
      }
      
      const supabaseUpdates: Record<string, any> = {};
      if (updates.username !== undefined) supabaseUpdates.username = updates.username;
      if (updates.avatar !== undefined) supabaseUpdates.avatar_url = updates.avatar;
      if (updates.banner_color !== undefined) supabaseUpdates.banner_color = updates.banner_color;
      if (updates.banner_url !== undefined) supabaseUpdates.banner_url = updates.banner_url;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      
      if (Object.keys(supabaseUpdates).length === 0) {
        return true;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile in database:', error);
        throw error;
      }
      
      console.log('Profile updated successfully in database');
      
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, status: updates.status || prev.status };
      });
      
      setAppUser(prev => {
        if (!prev) return null;
        const newState = { ...prev };
        if (updates.username !== undefined) newState.username = updates.username;
        if (updates.status !== undefined) newState.status = updates.status;
        if (updates.avatar !== undefined) newState.avatar = updates.avatar;
        if (updates.banner_color !== undefined) newState.banner_color = updates.banner_color;
        if (updates.banner_url !== undefined) newState.banner_url = updates.banner_url;
        return newState;
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return false;
    }
  };

  const onOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const onCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setAppUser(null);
          if (isMounted) setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          try {
            console.log('Fetching profile for user:', currentUser.id);
            setTimeout(async () => {
              try {
                await fetchUserProfile(currentUser.id);
                if (isMounted) setIsLoading(false);
              } catch (error) {
                console.error('Error in auth state change:', error);
                toast.error('Failed to load user profile');
                if (isMounted) setIsLoading(false);
              }
            }, 500);
          } catch (error) {
            console.error('Error in auth state change:', error);
            toast.error('Failed to load user profile');
            if (isMounted) setIsLoading(false);
          }
        } else {
          setAppUser(null);
          if (isMounted) setIsLoading(false);
        }
      }
    );

    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          try {
            console.log('Found existing session, fetching profile for user:', currentUser.id);
            await fetchUserProfile(currentUser.id);
          } catch (error) {
            console.error('Error fetching profile on init:', error);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (provider: 'github' | 'discord' | 'email', options?: { email?: string; password?: string }) => {
    setIsLoading(true);
    try {
      if (provider === 'email' && options?.email && options?.password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: options.email,
          password: options.password,
        });
        if (error) throw error;
      } else if (provider === 'github' || provider === 'discord') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setAppUser(null);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        fetchUserProfile,
        updateUserProfile,
        onOpenAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
