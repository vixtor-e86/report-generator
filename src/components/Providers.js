"use client";
import { UserProvider } from '@/contexts/marketplace/UserContext';
import { WalletProvider } from '@/contexts/marketplace/WalletContext';
import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <UserProvider>
      <WalletProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </WalletProvider>
    </UserProvider>
  );
}
