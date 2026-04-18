"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setSellerStatus(null);
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile (Fresh fetch from DB)
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
        // ✅ CRITICAL: Using profile.is_seller directly from the database
        setUser({
          id: authUser.id,
          name: profile.username || profile.full_name || authUser.email?.split('@')[0],
          email: profile.email || authUser.email,
          isSeller: profile.is_seller || false,
        });
      }

      setSellerStatus(sellerApp?.status || 'none');

      // 3. Fetch Notifications
      const { data: notifs } = await supabase
        .from('marketplace_notifications')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(notifs || []);
      setUnreadCount(notifs?.filter(n => !n.is_read).length || 0);

    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserProfile(authUser);
    }
  }, [fetchUserProfile]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
        .from('marketplace_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user]);

  useEffect(() => {
    refreshUser();

    // Set up real-time subscription for profile changes (to catch admin approvals)
    const profileSubscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_profiles',
        filter: `id=eq.${user?.id}` 
      }, () => {
        refreshUser();
      })
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileSubscription);
    };
  }, [refreshUser, fetchUserProfile, user?.id]);

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
      notifications,
      unreadCount,
      markNotificationsAsRead,
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
