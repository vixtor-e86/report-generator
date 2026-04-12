"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext(undefined);

// Mock user for demo
const mockUser = {
  id: '1',
  name: 'Victor Okafor',
  email: 'victor@student.edu.ng',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victor',
  isSeller: true,
  sellerProfile: {
    id: 's1',
    userId: '1',
    displayName: 'Vixtor Codes',
    bio: 'Computer Science student specializing in web development and AI projects',
    faculty: 'Engineering',
    department: 'Computer Science',
    level: '400',
    matricNumber: 'CSC/2019/001',
    verificationStatus: 'verified',
    rating: 4.8,
    totalSales: 23,
    projects: [],
  },
  createdAt: new Date(),
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(mockUser);

  const login = useCallback(async (_email, _password) => {
    // Mock login
    setUser(mockUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const register = useCallback(async (name, _email, _password) => {
    // Mock register
    const newUser = {
      id: Date.now().toString(),
      name,
      email: _email,
      isSeller: false,
      createdAt: new Date(),
    };
    setUser(newUser);
  }, []);

  const becomeSeller = useCallback(async (profile) => {
    if (!user) return;
    
    const sellerProfile = {
      id: `s${Date.now()}`,
      userId: user.id,
      displayName: profile.displayName || user.name,
      bio: profile.bio || '',
      faculty: profile.faculty || '',
      department: profile.department || '',
      level: profile.level || '',
      matricNumber: profile.matricNumber || '',
      verificationStatus: 'pending',
      rating: 0,
      totalSales: 0,
      projects: [],
    };

    setUser({
      ...user,
      isSeller: true,
      sellerProfile,
    });
  }, [user]);

  const updateUser = useCallback((updates) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      register,
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
