"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';
import FundingModal from '@/components/marketplace/FundingModal';

const WalletContext = createContext(undefined);

export function WalletProvider({ children }) {
  const { user } = useUser();
  const [wallet, setWallet] = useState({ balance: 0, currency: 'NGN', transactions: [] });
  const [loading, setLoading] = useState(true);
  const [showFundingModal, setShowFundingModal] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Fetch balance
      const { data: walletData, error: walletError } = await supabase
        .from('marketplace_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', walletError);
      }

      // 2. Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
      }

      setWallet({
        balance: walletData?.balance || 0,
        currency: walletData?.currency || 'NGN',
        transactions: txData || [],
      });
    } catch (err) {
      console.error('Unexpected wallet error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const deductFunds = useCallback(async (amount, description, metadata = {}) => {
    if (wallet.balance < amount) return false;

    const { error } = await supabase
      .from('marketplace_wallets')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', user.id);

    if (error) {
      console.error('Deduction failed:', error);
      return false;
    }

    // Record transaction
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      amount,
      type: 'purchase',
      status: 'completed',
      description,
      metadata,
    });

    fetchWalletData();
    return true;
  }, [wallet.balance, user, fetchWalletData]);

  return (
    <WalletContext.Provider value={{
      wallet,
      loading,
      refreshWallet: fetchWalletData,
      deductFunds,
      showFundingModal,
      setShowFundingModal
    }}>
      {children}
      <FundingModal open={showFundingModal} onOpenChange={setShowFundingModal} />
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
