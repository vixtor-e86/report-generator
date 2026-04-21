"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const userRef = useRef(null);
  const statusRef = useRef(null);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setSellerStatus(null);
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      userRef.current = null;
      statusRef.current = null;
      return;
    }

    try {
      // 1. Fetch fresh user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // 2. Fetch seller status
      const { data: sellerApp } = await supabase
        .from('marketplace_sellers')
        .select('status')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // 3. Fetch Notifications
      const { data: notifs } = await supabase
        .from('marketplace_notifications')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const isApproved = sellerApp?.status === 'approved' || profile?.is_seller;
      const currentStatus = sellerApp?.status || 'none';

      // Avoid redundant state updates
      if (!userRef.current || userRef.current.id !== authUser.id || userRef.current.isSeller !== !!isApproved || userRef.current.name !== (profile?.username || profile?.full_name)) {
        const newUser = {
            id: authUser.id,
            name: profile?.username || profile?.full_name || authUser.email?.split('@')[0],
            email: authUser.email,
            isSeller: !!isApproved,
        };
        setUser(newUser);
        userRef.current = newUser;
      }

      if (statusRef.current !== currentStatus) {
        setSellerStatus(currentStatus);
        statusRef.current = currentStatus;
      }

      setNotifications(notifs || []);
      setUnreadCount(notifs?.filter(n => !n.is_read).length || 0);

    } catch (err) {
      console.error('User context fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserProfile(authUser);
    } else {
        setLoading(false);
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

    // 1. Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user || null);
    });

    // 2. ✅ REAL-TIME STATUS SYNC (Sellers Table)
    const statusSub = supabase
      .channel('seller-status-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_sellers' 
      }, () => {
        refreshUser();
      })
      .subscribe();

    // 3. ✅ REAL-TIME PROFILE SYNC (User Profiles Table - Critical for Approval)
    const profileSub = supabase
      .channel('profile-sync-channel')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_profiles' 
      }, () => {
        refreshUser();
      })
      .subscribe();

    // 4. ✅ REAL-TIME NOTIFICATIONS
    const notifSub = supabase
      .channel('notifications-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'marketplace_notifications' 
      }, () => {
        refreshUser();
      })
      .subscribe();

    return () => {
        authSub.unsubscribe();
        supabase.removeChannel(statusSub);
        supabase.removeChannel(profileSub);
        supabase.removeChannel(notifSub);
    };
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
    setUser(prev => {
        const next = { ...prev, ...updates };
        userRef.current = next;
        return next;
    });
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
