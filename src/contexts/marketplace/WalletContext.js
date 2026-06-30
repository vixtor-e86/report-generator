"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';
import FundingModal from '@/components/marketplace/FundingModal';
import { toast } from 'sonner';

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

  // ✅ Auto-Verify wallet funding payment on redirect
  useEffect(() => {
    async function verifyUrlPayment() {
      if (typeof window === 'undefined' || !user) return;
      const params = new URLSearchParams(window.location.search);
      const transactionRef = params.get('transaction_ref') || params.get('tx_ref');
      
      if (transactionRef && transactionRef.includes('W3WL_FUND_') && !transactionRef.includes('MANUAL')) {
        try {
          const verifyUrl = `/api/squad/verify?transaction_ref=${transactionRef}`;
          const res = await fetch(verifyUrl);
          const data = await res.json();
          if (data.verified) {
            toast.success("Wallet funded successfully!");
            fetchWalletData();
          } else {
            toast.error(data.message || "Failed to verify wallet funding");
          }
        } catch (err) {
          console.error("Error verifying payment on mount:", err);
        } finally {
          // Clean URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('transaction_ref');
          newUrl.searchParams.delete('tx_ref');
          window.history.replaceState({}, '', newUrl);
        }
      }
    }

    verifyUrlPayment();
  }, [user, fetchWalletData]);

  const deductFunds = useCallback(async (amount, description, metadata = {}) => {
    if (wallet.balance < amount) return false;

    try {
      const response = await fetch('/api/marketplace/wallet/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          metadata,
          userId: user.id
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('Deduction failed:', data.error || 'Unknown error');
        return false;
      }

      fetchWalletData();
      return true;
    } catch (err) {
      console.error('Unexpected deduction error:', err);
      return false;
    }
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
