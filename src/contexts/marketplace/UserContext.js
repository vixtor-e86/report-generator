"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to auth user info if profile fetch fails
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          email: authUser.email,
          isSeller: false,
        });
      } else {
        setUser({
          id: authUser.id,
          name: profile.username || profile.full_name || authUser.email?.split('@')[0],
          email: profile.email || authUser.email,
          isSeller: profile.is_seller || false, // We'll add this column later if needed, for now default to false
          sellerProfile: null, // We'll build marketplace tables later
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      fetchUserProfile(authUser);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const becomeSeller = useCallback(async (profileData) => {
    if (!user) return;
    
    // For now, just update local state since we don't have marketplace tables yet
    // Later we will create 'marketplace_sellers' table
    setUser(prev => ({
      ...prev,
      isSeller: true,
      sellerProfile: {
        displayName: profileData.displayName || prev.name,
        ...profileData
      }
    }));
  }, [user]);

  const updateUser = useCallback((updates) => {
    if (!user) return;
    setUser(prev => ({ ...prev, ...updates }));
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      becomeSeller,
      updateUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
