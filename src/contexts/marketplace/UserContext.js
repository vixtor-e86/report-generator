"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Add profile state
  const [sellerStatus, setSellerStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const userRef = useRef(null);
  const statusRef = useRef(null);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
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
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setProfile(profileData); // Store profile

      // 2. Fetch seller status
      const { data: sellerApp } = await supabase
        .from('marketplace_sellers')
        .select('status')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // 3. Fetch Notifications (Personal + Global Broadcast Announcements)
      let notifs = [];
      try {
        const notifRes = await fetch(`/api/notifications?userId=${authUser.id}`);
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          notifs = notifData.notifications || [];
        } else {
          // Fallback direct query
          const { data } = await supabase
            .from('marketplace_notifications')
            .select('*')
            .or(`user_id.eq.${authUser.id},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20);
          notifs = data || [];
        }
      } catch (notifErr) {
        console.warn('Failed to load notifications from API, falling back:', notifErr);
      }

      // Check localStorage for read global notifications
      let readGlobalIds = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`w3_read_global_notifs_${authUser.id}`);
          if (stored) readGlobalIds = JSON.parse(stored);
        } catch (e) {
          console.warn('Error reading global notifications localStorage:', e);
        }
      }

      const processedNotifs = (notifs || []).map(n => {
        if (!n.user_id) {
          // Global broadcast: read state determined per user by localStorage
          return { ...n, is_read: readGlobalIds.includes(n.id) };
        }
        return n;
      });

      const isApproved = sellerApp?.status === 'approved' || profileData?.is_seller;
      const currentStatus = sellerApp?.status || 'none';

      // Avoid redundant state updates
      if (!userRef.current || userRef.current.id !== authUser.id || userRef.current.isSeller !== !!isApproved || userRef.current.name !== (profileData?.username || profileData?.full_name)) {
        const newUser = {
            id: authUser.id,
            name: profileData?.username || profileData?.full_name || authUser.email?.split('@')[0],
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

      setNotifications(processedNotifs);
      setUnreadCount(processedNotifs.filter(n => !n.is_read).length);

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

    // 1. Mark personal notifications in DB via API
    try {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (e) {
      console.error('Failed to mark notifications read on server:', e);
    }

    // 2. Mark all global notifications as read in localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`w3_read_global_notifs_${user.id}`);
        const currentRead = stored ? JSON.parse(stored) : [];
        const globalIds = notifications.filter(n => !n.user_id).map(n => n.id);
        const updated = Array.from(new Set([...currentRead, ...globalIds]));
        localStorage.setItem(`w3_read_global_notifs_${user.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist global notifications read state:', e);
      }
    }
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user, notifications]);

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
      }, (payload) => {
        if (payload.new) {
          const isTargeted = !payload.new.user_id || (userRef.current && payload.new.user_id === userRef.current.id);
          if (isTargeted) {
            toast(payload.new.title, {
              description: payload.new.message,
            });
          }
        }
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
      profile, // Export profile
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
