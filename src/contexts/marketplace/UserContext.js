"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setSellerStatus(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // 2. Fetch seller application status
      const { data: sellerApp } = await supabase
        .from('marketplace_sellers')
        .select('status')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
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
          isSeller: profile.is_seller || false,
        });
      }

      setSellerStatus(sellerApp?.status || 'none');

    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    await fetchUserProfile(authUser);
  }, [fetchUserProfile]);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [refreshUser, fetchUserProfile]);

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateUser = useCallback((updates) => {
    if (!user) return;
    setUser(prev => ({ ...prev, ...updates }));
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      sellerStatus,
      loading,
      isAuthenticated: !!user,
      refreshUser,
      login,
      logout,
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
