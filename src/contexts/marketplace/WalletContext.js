"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const WalletContext = createContext(undefined);

// Mock wallet with initial balance
const mockWallet = {
  balance: 15000,
  currency: 'NGN',
  transactions: [
    {
      id: 't1',
      type: 'deposit',
      amount: 20000,
      description: 'Initial deposit',
      status: 'completed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't2',
      type: 'payment',
      amount: 3500,
      description: 'Purchase: React E-commerce Project',
      status: 'completed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't3',
      type: 'payment',
      amount: 1500,
      description: 'Tool: Plagiarism Checker (3 uses)',
      status: 'completed',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ],
};

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(mockWallet);

  const addFunds = useCallback(async (amount) => {
    const transaction = {
      id: `t${Date.now()}`,
      type: 'deposit',
      amount,
      description: 'Wallet deposit',
      status: 'completed',
      createdAt: new Date(),
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [transaction, ...prev.transactions],
    }));
  }, []);

  const deductFunds = useCallback(async (amount, description) => {
    if (wallet.balance < amount) {
      return false;
    }

    const transaction = {
      id: `t${Date.now()}`,
      type: 'payment',
      amount,
      description,
      status: 'completed',
      createdAt: new Date(),
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance - amount,
      transactions: [transaction, ...prev.transactions],
    }));

    return true;
  }, [wallet.balance]);

  const addEarnings = useCallback((amount, description) => {
    const transaction = {
      id: `t${Date.now()}`,
      type: 'earning',
      amount,
      description,
      status: 'completed',
      createdAt: new Date(),
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [transaction, ...prev.transactions],
    }));
  }, []);

  return (
    <WalletContext.Provider value={{
      wallet,
      addFunds,
      deductFunds,
      addEarnings,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
